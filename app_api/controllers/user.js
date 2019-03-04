const debug = require('debug')('onemzone');
const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const speakeasy = require('speakeasy');
const Nexmo = require('nexmo')

const nexmo = new Nexmo({
    apiKey: process.env.NEXMO_API_KEY,
    apiSecret: process.env.NEXMO_API_SECRET
})

const smsVerify = process.env.NEXMO_ENABLED || "false";

const from = 'ONEm';

var UserSchema = require('../models/Model').UserSchema;
var User = mongoose.model('users', UserSchema);

exports.checkMsisdn = function (User) {
    return function (req, res) {
        if (req.query.msisdn) {
            User.find({ msisdn: req.query.msisdn }).then(function (user) {
                if (user && user.length > 0) {
                    debug("/checkMsisdn - msisdn found");
                    return res.status(401).send({ status: false, error: "msisdn found" });
                }
                res.status(200).send({ status: true });
            }).catch(function (error) {
                debug("/user - user not found");
                debug(error);
                res.status(500).send({ error: "server error" });
            });
        } else {
            res.status(400).send({ error: "bad request" });
        }
    }
}

exports.delete = function (User) {
    return function (req, res) {
        if (!req.user) {
            return res.status(401).send({ error: "not authorized" });
        }
        User.remove({ _id: req.user }).then(function (result) {
            if (!result.ok) throw "Error deleting";
            debug("/user delete ok");
            debug(result);
            res.status(200).send({ result: 'Success' });
        }).catch(function (error) {
            debug("/user delete");
            debug(error);
            res.status(500).send({ result: 'Fail', error: "Error deleting" });
        });
    }
}

exports.getMsisdn = function (User) {
    return function (req, res) {
        if (!req.user) {
            return res.status(401).send({ error: "not authorized" });
        }
        User.findById({ _id: req.user }).then(function (user) {
            if (!user || !user.msisdn) {
                debug("/getMsisdn - user not found");
                return res.status(401).send({ error: "msisdn not found" });
            }
            var userObj = {};
            userObj.firstName = user.firstName;
            userObj.lastName = user.lastName;
            userObj.email = user.email;

            res.status(200).send({ msisdn: user.msisdn, user: userObj });
        }).catch(function (error) {
            debug("/user - user not found");
            debug(error);
            res.status(500).send({ error: "server error" });
        });

    }
}

exports.getProfile = function (id) {
    return function (req, res) {
        res.status(200).send({
            user: {
                touchMode: req.userProfile.touchMode,
                dontSendEmails: req.userProfile.dontSendEmails
            }
        });
    }
}

exports.setProfile = function (User) {
    return function (req, res) {

        var setObj = {};

        if (!req.user) {
            debug("/updateMsisdn");
            debug("user not found");
            return res.status(401).send({
                message: "User not found"
            });
        }
        debug(req.body);
        if (typeof req.body.touchMode !== "undefined" && typeof req.body.touchMode !== "boolean") {
            debug(typeof req.body.touchMode);
            debug("/setProfile");
            debug("missing param");
            return res.status(400).send({
                message: "Malformed request"
            });
        }
        if (typeof req.body.dontSendEmails !== "undefined" && typeof req.body.dontSendEmails !== "boolean") {
            debug(typeof req.body.dontSendEmails);
            debug("/setProfile");
            debug("missing param");
            return res.status(400).send({
                message: "Malformed request"
            });
        }
        if (typeof req.body.touchMode == "undefined" &&
            typeof req.body.dontSendEmails == "undefined") {
            debug(typeof req.body.touchMode);
            debug(typeof req.body.dontSendEmails);
            debug("/setProfile");
            debug("missing param");
            return res.status(400).send({
                message: "Malformed request"
            });
        }
        
        if (typeof req.body.touchMode !== "undefined") {
            setObj.touchMode = req.body.touchMode;
        }

        if (typeof req.body.dontSendEmails !== "undefined") {
            setObj.dontSendEmails = req.body.dontSendEmails;
        }

        User.findOneAndUpdate({ _id: ObjectId(req.user) }, {
            $set: setObj
        }, { new: true }, function (error, user) {
            if (error || !user) {
                debug("/update");
                debug(error);
                res.status(500).send({ error: error });
            } else {
                var userObj = {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    touchMode: user.touchMode,
                    dontSendEmails: user.dontSendEmails
                };
                res.json({ user: userObj });
            }
        });
    }
}

exports.getUser = function (id) {
    return new Promise(function (resolve, reject) {
        debug("querying:" + id);
        User.findOne({ _id: id }).then(function (user) {
            if (!user) {
                reject("user not found");
            } else {
                resolve(user);
            }
        }).catch(function (error) {
            reject(error);
        });
    });
}

exports.verifyToken = function (User) {
    return function (req, res) {
        if (!req.user) {
            debug("/verifyToken");
            debug("user not found");
            return res.status(401).send({
                message: "User not found"
            });
        }
        if (!req.query.token) {
            debug("/verifyToken");
            debug("user missing token");
            return res.status(400).send({
                message: "Malformed request"
            });
        }
        User.findById({ _id: req.user }).then(function (user) {
            if (!user) {
                return res.status(401).send({
                    message: "User profile error"
                });
            }
            var tokenOK = speakeasy.totp.verify({
                secret: user.secret,
                encoding: 'base32',
                token: req.query.token,
                window: 6
            });
            if (tokenOK) {
                res.json({ status: true });
            } else {
                res.json({ status: false });
            }
        });
    }
}

exports.sendToken = function (User) {
    return function (req, res) {
        if (!req.user) {
            debug("/sendToken");
            debug("user not found");
            return res.status(401).send({
                message: "User not found"
            });
        }
        if (!req.query.msisdn) {
            debug("/sendToken");
            debug("user missing msisdn");
            return res.status(400).send({
                message: "Malformed request"
            });
        }
        User.findById({ _id: req.user }).then(function (user) {
            if (!user) {
                return res.status(401).send({
                    message: "User profile error"
                });
            }
            var token = speakeasy.totp({
                secret: user.secret,
                encoding: 'base32'
            });
            var text = "ONEm verification code: " + token;
            debug(text);
            debug("smsVerify:" + smsVerify);
            if (smsVerify.toLowerCase() == "true") {
                debug("sending sms");
                nexmo.message.sendSms(from, req.query.msisdn, text, function (err, response) {
                    if (err) {
                        debug(err);
                    } else {
                        console.dir(response);
                    }
                });
            }
            res.status(200).send({ status: true });
        });
    }
}

exports.updateMsisdn = function (User) {
    return function (req, res) {

        if (!req.user) {
            debug("/updateMsisdn");
            debug("user not found");
            return res.status(401).send({
                message: "User not found"
            });
        }

        if (!req.body.msisdn) {
            debug("/updateMsisdn");
            debug("user not found");
            return res.status(400).send({
                message: "Malformed request"
            });
        }

        User.findOneAndUpdate({ _id: ObjectId(req.user) }, {
            $set: {
                msisdn: req.body.msisdn,
            }
        }, { new: true }, function (error, user) {
            if (error || !user) {
                debug("/update");
                debug(error);
                res.status(500).send({ error: error });
            } else {
                var userObj = {
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName
                };
                res.json({ user: userObj });
            }
        });
    }
}
