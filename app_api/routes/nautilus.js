const debug = require('debug')('onemzone');

var express = require('express');
var mongoose = require('mongoose');
var bluebird = require('bluebird');

var common = require('../common/common.js');
//var developer = require('../controllers/devleoper.js');
//var service = require('../controllers/service.js');
var naut = express.Router();

var ServiceSchema = require('../models/Model').ServiceSchema;
var Service = mongoose.model('services', ServiceSchema);

var DeveloperSchema = require('../models/Model').DeveloperSchema;
var Developer = mongoose.model('developers', DeveloperSchema);

var VerbSchema = require('../models/Model').VerbSchema;
var Verb = mongoose.model('verbs', VerbSchema);

function ensureAuthenticated(req, res, next) {
    if (!req.header('Authorization')) {
        debug("missing header");
        return res.status(401).send({ message: 'Unauthorized request' });
    }
    var token = req.header('Authorization').split(' ')[1];

    var payload = common.decodeJWT(token);
    debug("decoded payload");
    debug(payload);
    if (!payload) {
        return res.status(401).send({ message: 'Unauthorized Request' });
    }
    user.getUser(payload.sub).then(function (user) {
        req.user = user._id;
        req.userProfile = user;
        next();
    }).catch(function (error) {
        debug(error);
        debug("user not found!!");
        return res.status(401).send({ message: 'Unauthorized request' });
    });
}

naut.post('/service', function (req, res) {
    var savedDeveloper;

    var saveVerb = function (v) {
        var verb = new Verb();
        verb.name = v.name;
        verb._service = v.serviceId;
        verb.route = v.route;
        return verb.save();
    }

    if (!req.body.apiKey || !req.body.serviceName || !req.body.verbs || (req.body.verbs && req.body.verbs.length == 0)) {
        debug("/service malformed request");
        debug(req.body);
        return res.status(400).send({ error: "malformed request" });
    }

    Developer.findOne({ apiKey: req.body.apiKey }).then(function (developer) {
        if (!developer) {
            debug("/service - developer not found");
            throw { code: 401, message: "developer not found" };
        }
        savedDeveloper = developer;
        return Service.findOne({ name: req.body.serviceName });
    }).then(function (service) {
        if (service) {
            debug("/service - service name already registered");
            throw { code: 401, message: "service name already registered" };
        }
        var service = new Service();
        service.name = req.body.serviceName;
        service._developer = savedDeveloper._id;
        return service.save();
    }).then(function (service) {
        var verbsArray = [];
        req.body.verbs.map(function (verb) {
            verbsArray.push({
                name: verb.name,
                serviceId: service._id,
                route: verb.route
            })
        });
        return bluebird.map(verbsArray, saveVerb);
    }).then(function (result) {
        res.status(200).send({ result: "OK" });
    }).catch(function (error) {
        debug("/service - error");
        debug(error);
        if (error.code) {
            res.status(error.code).send({ error: error.message });
        } else {
            res.status(500).send({ error: "server error" });
        }
    });
});

module.exports = naut;
