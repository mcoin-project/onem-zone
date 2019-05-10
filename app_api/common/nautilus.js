const debug = require('debug')('onemzone');
const clients = require('../common/clients.js');
const common = require('../common/common.js');
const verbs = require('../common/verbs.js');
const message = require('../controllers/message.js');
const request = require('request-promise');

exports.sendSMS = async function (from, to, mtText, api) {
    debug("/sendSMS");
    if (typeof await clients.isConnected(from)) {
        try {
            var context = await clients.getContext(from);
            debug("context is:");
            debug(context);
            debug('mtText:')
            debug(mtText);
            
            await clients.newMtMessage(from, mtText, api);
            await clients.sendMessage(from, mtText);
            if (context.requestNeeded()) {
                await clients.pushContext(from);
            }
        } catch (err) {
            debug("oops no session: " + err);
            throw err;
            if (!api) {
                common.sendEmail(from, mtText);
                message.save(from, to, mtText);
            }
        };
    } else {
        common.sendEmail(from, mtText);
        message.save(from, to, mtText);
    }
}

exports.isSystemVerb = function (moText) {
    debug("/isSystemVerb");
    var words = moText.split(' ');

    if (words.length == 1 && words[0] == verbs.BACK_VERB) {
        return true;
    }
    if (words.length == 1 && words[0] == verbs.MORE_VERB) {
        return true;
    }
    if (words[0] == verbs.SIZE_VERB || words[0] == verbs.GO_VERB) {
        return true;
    }
    return false;
}

exports.executeSystemVerb = async function (from, to, moText, api) {
    debug("/executeSystemVerb");

    var mtText;
    if (moText.split(' ')[0] == verbs.GO_VERB) {
        var context = await clients.getContext(from);
        if (context.hasChunks()) {
            await clients.go(from, moText);
            await clients.sendMessage(from);
        } else {
            exports.sendSMS(from, to, "No chunks available.", api);
        }
    } else if (moText == verbs.MORE_VERB) {
        try {
            var context = await clients.getContext(from);
            if (context.hasChunks()) {
                await clients.more(from);
                await clients.sendMessage(from);
            } else {
                await exports.sendSMS(from, to, "No chunks available.", api);
            }
        } catch (error) {
            debug(error);
        }

    } else if (moText == verbs.BACK_VERB) {

        try {
            await clients.goBack(from);
            var ctext = await clients.getContext(from);
            if (ctext.hasChunks()) {
                await clients.sendMessage(from);
            } else if (ctext.requestNeeded()) {
                debug("/executeSystemVerb /request needed")
                mtText = await ctext.makeMTResponse();
                await exports.sendSMS(from, to, mtText, api);

            } else {
                await ctext.getRequestParams(from, moText);  // this can be improved, should be necessary to call the entire thing!
                mtText = await ctext.makeMTResponse();
                await exports.sendSMS(from, to, mtText, api);
            }

        } catch (error) {
            debug(error);
        }
    } else if (moText.split(' ')[0] == verbs.SIZE_VERB) {
        mtText = await clients.size(from, moText);
        if (mtText) {
            await exports.sendSMS(from, to, mtText, api);
        }
    }
}

exports.processMessage = async function (from, to, moText, api) {
    debug("/processMessage" + moText)

    var mtText, ctext = await clients.getContext(from);
    try {
        if (moText.startsWith('#')) {
            await clients.switchService(from, moText);
            ctext = await clients.newContext(from, await clients.getBody(from));
        }
        debug("requestNeeded:" + ctext.requestNeeded());
        if (ctext.requestNeeded()) {
            var requestParams = await ctext.getRequestParams(from, moText);
            debug("requestParams:");
            debug(requestParams);
            var body = await request(requestParams);
            ctext = await clients.setContext(from, body);
            mtText = await ctext.makeMTResponse();
        } else {
            await ctext.getRequestParams(from, moText);  // this can be improved, should be necessary to call the entire thing!
            mtText = await ctext.makeMTResponse();
        }
        await clients.setMtText(from, mtText);

    } catch (err) {
        debug(err);
        if (err.invalidOption) {
            mtText = err.invalidOption;
            await clients.setMtText(from, mtText);
        } else {
            debug("error:");
            debug(err);
            return;
        }
    }
    //   debug("sending SMS:"+ mtText);
    await exports.sendSMS(from, to, mtText, api);
}