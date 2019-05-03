const debug = require('debug')('onemzone');

var express = require('express');
var mongoose = require('mongoose');
var bluebird = require('bluebird');

var common = require('../common/common.js');
//var developer = require('../controllers/devleoper.js');
//var service = require('../controllers/service.js');
var naut = express.Router();

var Service = require('../models/Model').Service;

var Developer = require('../models/Model').Developer;

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
    var savedDeveloper, savedService;

    var saveVerb = function (v) {
        return Verb.findOneAndUpdate({ name: v.name, _service: v.serviceId },
            {
                name: v.name,
                _service: v.serviceId,
                route: v.route,
                footer: v.footer
            }, { upsert: true });
    }

    if (!req.body.apiKey || !req.body.serviceName || !req.body.verbs || (req.body.verbs && req.body.verbs.length == 0)) {
        debug("/service malformed request");
        debug(req.body);
        return res.status(400).send({ error: "malformed request" });
    }

    Developer.findOne({ apiKey: req.body.apiKey }).populate('_user').then(function (developer) {
        if (!developer) {
            debug("/service - developer not found");
            throw { code: 401, message: "developer not found" };
        }
        savedDeveloper = developer;
        debug("savedDeveloper");
        debug(savedDeveloper);
        return Service.findOne({ name: req.body.serviceName.toLowerCase() }).populate('_developer');
    }).then(function (service) {
        debug("service:");
        debug(service);
        if (!service) throw "service not found";
        savedService = service;
        return Developer.findOne({ _id: service._developer}).populate('_user');
    }).then(function(developer) {
        debug("developer._user.email:" + developer._user.email);
        debug("savedDeveloper._user.email:" + savedDeveloper._user.email);
        if (developer && developer._user.email !== savedDeveloper._user.email) {
            debug("/service - service name already registered");
            throw { code: 401, message: "service name already registered" };
        }
        savedService.name = req.body.serviceName;
        savedService._developer = savedDeveloper._id;
        savedService.callbackPath = req.body.callbackPath;
        return Service.findOneAndUpdate({ name: req.body.serviceName },
            { name: req.body.serviceName,
              _developer: savedDeveloper._id,
              callbackPath: req.body.callbackPath
             },
            { upsert: true });
    }).then(function (service) {
        // remove all the verbs first because we'll overwrite them
        return Verb.deleteMany({ _service: service._id });
    }).then(function () {
        var verbsArray = [];
        req.body.verbs.map(function (verb) {
            verbsArray.push({
                name: verb.name,
                serviceId: savedService._id,
                route: verb.route,
                footer: verb.footer || false
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
