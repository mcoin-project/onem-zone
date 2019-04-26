const debug = require('debug')('onemzone');
const clients = require('../common/clients.js');
const common = require('../common/common.js');
const context = require('../common/context.js');
const message = require('../controllers/message.js');
const request = require('request-promise');
var mongoose = require('mongoose');

const options = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

var Service = require('../models/Model').Service;
var ServicesList = require('../models/Model').ServicesList;
var Verb = require('../models/Model').Verb;

exports.services = [
    '#todo', '#coop'
];

exports.sendSMS = async function (from, to, moText, api) {
    debug("Naut: moText:" + moText)
    var trimmedText = moText.trim();
    var mtText;

    try {
        var ctext = new context.Context(clients.currentService(from), clients.getContext(from));
        await ctext.initialize();
        var requestParams = ctext.getRequestParams(from, moText);
        var body = await request(requestParams);
        mtText = new context.Context(clients.currentService(from), body).makeMTResponse();
        clients.setContext(from, body);
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