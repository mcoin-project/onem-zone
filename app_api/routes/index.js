const debug = require('debug')('onem-zone');

var express = require('express');
var mongoose = require('mongoose');

var common = require('../common/common.js');
var user = require('../controllers/user.js');
var auth = require('../controllers/auth');
var api = express.Router();

var UserSchema = require('../models/Model').UserSchema;
var User = mongoose.model('users', UserSchema);
var wsProtocol = process.env.WS_PROTOCOL || "ws";
var sipProxy = process.env.SIP_PROXY || "zoiper.dhq.onem";

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
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
        next();
    }).catch(function (error) {
        debug(error);
        debug("user not found!!");
        return res.status(401).send({ message: 'Unauthorized request' });
    });
}

api.get('/user', ensureAuthenticated, function (req, res) {
    if (req.user) {
        User.findById({_id: req.user}).then(function(user) {
            if (!user) {
                debug("/user - user not found");
                return res.status(401).send({error: "user not found"});
            }
            res.status(200).send({ msisdn: user.msisdn, user: req.user });
        }).catch(function(error) {
            debug("/user - user not found");
            debug(error);
            res.status(500).send({ error: "server error" });
        });
    } else {
        res.status(401).send({ error: "not authorized" });
    }
});

api.get('/user/sendToken', ensureAuthenticated, user.sendToken(User));
api.get('/user/verifyToken', ensureAuthenticated, user.verifyToken(User));
api.get('/user/msisdn', ensureAuthenticated, user.getMsisdn(User));
api.get('/user/checkMsisdn', ensureAuthenticated, user.checkMsisdn(User));

api.put('/user/msisdn', ensureAuthenticated, user.updateMsisdn(User));

api.get('/start', ensureAuthenticated, function (req, res) {
    var httpProtocol = req.get('Referer').split(":")[0];
    debug(httpProtocol);
    debug(wsProtocol);

    if (httpProtocol == 'https') {
        // the used protocol is HTTPS
        debug('The HTTPS protocol has been used; "wss" will be used for WebRTC');
        wsProtocol = "wss";
    } else {
        debug('It appears that HTTP protocol has been used; environment provided protocol or "ws" will be used for WebRTC');
        wsProtocol = process.env.WS_PROTOCOL || "ws";
    };
    debug(wsProtocol);

    res.json({
        msisdn: req.msisdn,
        sipproxy: sipProxy,
        wsprotocol: wsProtocol
    });

});

api.post('/auth/google', auth.googleAuth(User));
api.post('/auth/facebook', auth.facebookAuth(User));

module.exports = api;
