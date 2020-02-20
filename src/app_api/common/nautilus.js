const debug = require('debug')('onemzone');
const clients = require('../common/clients.js');
const common = require('../common/common.js');
const verbs = require('../common/verbs.js');
const message = require('../controllers/message.js');
const request = require('request-promise');

exports.sendSMS = function (from, to, mtText, api) {
    if (typeof clients.isConnected(from)) {
        try {
            clients.newMtMessage(from, mtText, api);
            clients.sendMessage(from);
        } catch (err) {
            debug("oops no session: " + err);
            common.sendEmail(from, mtText);

            // don't save api messages
            if (!api) {
                message.save(from, to, mtText);
            }
        };
    } else {
        common.sendEmail(from, mtText);
        message.save(from, to, mtText);
    }
}

exports.isSystemVerb = function (moText) {
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
    var mtText;
    if (moText.split(' ')[0] == verbs.GO_VERB) {
        if (clients.getContext(from).hasChunks()) {
            clients.go(from, moText);
            clients.sendMessage(from);
        } else {
            exports.sendSMS(from, to, "No chunks available.", api);
        }
    } else if (moText == verbs.MORE_VERB) {
        if (clients.getContext(from).isMoreChunks()) {
            clients.more(from);
            clients.sendMessage(from);
        } else {
            exports.sendSMS(from, to, "No chunks available.", api);
        }
    } else if (moText == verbs.BACK_VERB) {
        clients.goBack(from);
        // var ctext = clients.getContext(from);
        // exports.sendSMS(from, to, mtText, api);
        try {
            var ctext = clients.getContext(from);
            mtText = ctext.makeMTResponse();
            exports.sendSMS(from, to, mtText, api);
        } catch (error) {
            debug(error);
        }
    } else if (moText.split(' ')[0] == verbs.SIZE_VERB) {
        mtText = clients.size(from, moText);
        if (mtText) {
            exports.sendSMS(from, to, mtText, api);
        }
    }
}

exports.processMessage = async function (from, to, moText, api) {
    debug("Naut: moText:" + moText)

    var mtText, ctext = clients.getContext(from);
    debug("ctext:");
    debug(ctext);
    try {
        if (moText.startsWith('#') || (ctext && ctext.getVerb(moText) !== false)) {
            debug("service switch or service-specific verb");
            ctext = await clients.newContext(from, clients.getBody(from));
        }
        debug("requestNeeded:" + ctext.requestNeeded());
        if (ctext.requestNeeded()) {
            var requestParams = ctext.getRequestParams(from, moText);
            var body = await request(requestParams);
            //ctext = await clients.newContext(from, body);
            ctext = await clients.setContext(from, body);
            //clients.setBody(from, body);

            mtText = ctext.makeMTResponse();
        } else {
            ctext.getRequestParams(from, moText);  // this can be improved, should be necessary to call the entire thing!
            mtText = ctext.makeMTResponse();
            debug("request not needed");
            debug(mtText);
        }
    } catch (err) {
        debug(err);
        if (err.invalidOption) {
            mtText = err.invalidOption;
        } else {
            debug("error:");
            debug(err);
            return;
        }
    }
    debug("sending SMS:"+ mtText);
    exports.sendSMS(from, to, mtText, api);
}