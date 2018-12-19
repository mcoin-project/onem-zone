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
        console.log("missing header");
        return res.status(401).send({ message: 'Unauthorized request' });
    }
    var token = req.header('Authorization').split(' ')[1];

    var payload = common.decodeJWT(token);
    console.log("decoded payload");
    console.log(payload);
    if (!payload) {
        return res.status(401).send({ message: 'Unauthorized Request' });
    }
    user.getUser(payload.sub).then(function (user) {
        req.user = user._id;
        next();
    }).catch(function (error) {
        console.log(error);
        console.log("user not found!!");
        return res.status(401).send({ message: 'Unauthorized request' });
    });
}

api.get('/user', ensureAuthenticated, function (req, res) {
    if (req.user) {
        User.findById({_id: req.user}).then(function(user) {
            if (!user) {
                console.log("/user - user not found");
                return res.status(401).send({error: "user not found"});
            }
            res.status(200).send({ msisdn: user.msisdn, user: req.user });
        }).catch(function(error) {
            console.log("/user - user not found");
            console.log(error);
            res.status(500).send({ error: "server error" });
        });
    } else {
        res.status(401).send({ error: "not authorized" });
    }
});

api.get('/user/sendToken', ensureAuthenticated, user.sendToken(User));
api.get('/user/verifyToken', ensureAuthenticated, user.verifyToken(User));
api.get('/user/msisdn', ensureAuthenticated, user.getMsisdn(User));

api.put('/user/msisdn', ensureAuthenticated, user.updateMsisdn(User));

api.get('/start', ensureAuthenticated, function (req, res) {
    var httpProtocol = req.get('Referer').split(":")[0];
    console.log(httpProtocol);
    console.log(wsProtocol);

    if (httpProtocol == 'https') {
        // the used protocol is HTTPS
        console.log('The HTTPS protocol has been used; "wss" will be used for WebRTC');
        wsProtocol = "wss";
    } else {
        console.log('It appears that HTTP protocol has been used; environment provided protocol or "ws" will be used for WebRTC');
        wsProtocol = process.env.WS_PROTOCOL || "ws";
    };
    console.log(wsProtocol);

    res.json({
        msisdn: req.msisdn,
        sipproxy: sipProxy,
        wsprotocol: wsProtocol
    });

});

api.post('/auth/google', auth.googleAuth(User));

module.exports = api;
