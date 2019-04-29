const debug = require('debug')('onemzone');
const clients = require('../common/clients.js');
const common = require('../common/common.js');
const message = require('../controllers/message.js');
const request = require('request-promise');

const BACK_VERB = 'back';
const GO_VERB = 'go';
const MORE_VERB = 'more';

exports.systemVerbs = [
    GO_VERB, MORE_VERB, BACK_VERB
]

exports.sendSMS = function (from, mtText, api) {
    if (typeof clients.isConnected(from)) {
        try {
            clients.newMtMessage(from, mtText, api);
            clients.sendMessage(from);
        } catch (err) {
            debug("oops no session: " + err);
            common.sendEmail(to, mtText);

            // don't save api messages
            if (!api) {
                message.save(from, to, mtText);
            }
        };
    } else {
        common.sendEmail(to, mtText);
        message.save(from, to, mtText);
    }
}

exports.executeSystemVerb = async function (from, to, moText, api) {
    var mtText;

    switch (moText) {
        case BACK_VERB:
            clients.goBack(from);
            mtText = clients.getContext(from).makeMTResponse();
            exports.sendSMS(from, mtText, api);
            break;
        default:
    }
}

exports.processMessage = async function (from, to, moText, api) {
    debug("Naut: moText:" + moText)
    var mtText, ctext = clients.getContext(from);

    try {
        if (moText.startsWith('#') || (ctext && ctext.getVerb(moText) !== false)) {
            debug("service switch or service-specific verb");
            ctext = await clients.newContext(from, clients.getBody(from));
        }
        debug("ctext:");
        debug(ctext);
        debug("requestNeeded:" + ctext.requestNeeded());
        if (ctext.requestNeeded()) {
            var requestParams = ctext.getRequestParams(from, moText);
            var body = await request(requestParams);
            clients.setBody(from, body);
            ctext = await clients.newContext(from, body);
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
    exports.sendSMS(from, mtText, api);
}