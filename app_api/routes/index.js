var express = require('express');
var mongoose = require('mongoose');

var sms = require('../common/sms.js');
var auth = require('../controllers/auth');
var api = express.Router();

var UserSchema = require('../models/Model').UserSchema;
var User = mongoose.model('users', UserSchema);

// api.post('/mosms', function(req, res) {

//     if (!req.body.source) {
//         return res.status(500).send({ error: 'missing source param' });
//     }

//     if (!req.body.text) {
//         return res.status(500).send({ error: 'missing text param' });
//     }

//     console.log("/api/mosms - sending SMS to Short Number " + shortNumber);
//     sms.sendSMS(req.body.source, shortNumber, req.body.text);

//     res.status(200).send();

// });

api.post('/auth/google', auth.googleAuth(User));

module.exports = api;
