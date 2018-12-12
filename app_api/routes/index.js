var express = require('express');
var sms = require('../common/sms.js')
var api = express.Router();

api.post('/mosms', function(req, res) {

    if (!req.body.source) {
        return res.status(500).send({ error: 'missing source param' });
    }

    if (!req.body.text) {
        return res.status(500).send({ error: 'missing text param' });
    }

    console.log("/api/mosms - sending SMS to Short Number " + shortNumber);
    sms.sendSMS(req.body.source, shortNumber, req.body.text);

    res.status(200).send();

});

module.exports = api;
