const debug = require('debug')('onemzone');
const clients = require('../common/clients.js');
const common = require('../common/common.js');
const context = require('../common/context.js');
const message = require('../controllers/message.js');
const apiUrl = process.env.API_BASE_PATH || 'localhost:5000/api';
const request = require('request-promise');
var mongoose = require('mongoose');

const options = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

var ServiceSchema = require('../models/Model').ServiceSchema;
var Service = mongoose.model('services', ServiceSchema);
var VerbSchema = require('../models/Model').VerbSchema;
var Verb = mongoose.model('verbs', VerbSchema);

exports.services = [
    '#todo'
];

//return the verbs for the provided service
exports.loadVerbs = async function (service) {
    var service = service.substring(1, service.length);
    debug("looking up service: " + service);
    try {
        var s = await Service.findOne({ name: service.toLowerCase() });
        if (!s) throw { code: 200, message: 'no service with name: ' + service }
        debug("result from service lookup:");
        debug(s);
        var verbs = await Verb.find({ _service: s._id });
        return verbs;
    } catch (error) {
        debug(error);
        if (error.code == 200) return [];
        throw error;
    };
}

exports.sendSMS = async function (from, to, moText) {
    debug("Naut: moText:" + moText)
    var trimmedText = moText.trim();
    var client = clients.clients[from];

    try {
        var ctext = new context.Context(apiUrl, client.context, client.verbs);
        var requestParams = ctext.getRequestParams(from, moText);
        var body = await request(requestParams);
        client.moRecord.mtText = new context.Context(apiUrl, body.data, client.verbs).makeMTResponse();
        client.context = Object.assign({}, body.data);
    } catch (err) {
        debug(err);
        if (err.invalidOption) {
            client.moRecord.mtText = err.invalidOption
        } else {
            debug("error:");
            debug(err);
            return;
        }
    }

    if (typeof client.moRecord.socket !== 'undefined') {

        try {
            debug("trying response: " + client.moRecord.mtText);
            var channel = 'MT SMS';
            if (client.moRecord.api) {
                debug("responding on MT API channel");
                channel = 'API MT SMS';
            }
            client.moRecord.socket.emit(channel, { mtText: client.moRecord.mtText }); //Send the whole message at once to the web exports.clients.

        } catch (err) {
            debug("oops no session: " + err);
            common.sendEmail(to, client.moRecord.mtText);

            // don't save api messages
            if (!client.moRecord.api) {
                message.save(from, to, client.moRecord.mtText);
            }
        };
    } else {
        common.sendEmail(to, client.moRecord.mtText);
        message.save(from, to, client.moRecord.mtText);
    }
    client.moRecord.mtText = '';


}