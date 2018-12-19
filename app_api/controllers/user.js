const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const speakeasy = require('speakeasy');
const Nexmo = require('nexmo')

const nexmo = new Nexmo({
  apiKey: process.env.NEXMO_API_KEY,
  apiSecret: process.env.NEXMO_API_SECRET
})

const from = 'ONEm';

var UserSchema = require('../models/Model').UserSchema;
var User = mongoose.model('users', UserSchema);

exports.getMsisdn = function(User) {
    return function(req, res) {
        if (req.user) {
            User.findById({_id: req.user}).then(function(user) {
                if (!user || !user.msisdn) {
                    console.log("/getMsisdn - user not found");
                    return res.status(401).send({error: "msisdn not found"});
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
    }
}

exports.getUser = function(id) {
    return new Promise(function(resolve, reject) {
        console.log("querying:"+id);
        User.findOne({ _id: id }).then(function(user) {
            if (!user) {
                reject("user not found");
            } else {
                resolve(user);
            }
        }).catch(function(error) {
            reject(error);
        });
    });
}

exports.verifyToken = function(User) {
    return function(req, res) {
        if (!req.user) {
            console.log("/verifyToken");
            console.log("user not found");
            return res.status(401).send({
                message: "User not found"
            });
        }
        if (!req.query.token) {
            console.log("/verifyToken");
            console.log("user missing token");
            return res.status(400).send({
                message: "Malformed request"
            });         
        }
        User.findById({_id: req.user}).then(function(user) {
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
                res.json({status: true});
            } else {
                res.json({status: false});
            }
        });
    }
}

exports.sendToken = function(User) {
    return function(req, res) {
        if (!req.user) {
            console.log("/sendToken");
            console.log("user not found");
            return res.status(401).send({
                message: "User not found"
            });
        }
        if (!req.query.msisdn) {
            console.log("/sendToken");
            console.log("user missing msisdn");
            return res.status(400).send({
                message: "Malformed request"
            });         
        }
        User.findById({_id: req.user}).then(function(user) {
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
            console.log(text);
//            nexmo.message.sendSms(from, req.query.msisdn, text);
            res.status(200).send({status: true});
        });
    }
}

exports.updateMsisdn = function(User) {
    return function(req, res) {

        if (!req.user) {
            console.log("/updateMsisdn");
            console.log("user not found");
            return res.status(401).send({
                message: "User not found"
            });
        }

        if (!req.body.msisdn) {
            console.log("/updateMsisdn");
            console.log("user not found");
            return res.status(400).send({
                message: "Malformed request"
            });  
        }

        User.findOneAndUpdate({ _id: ObjectId(req.user) }, {
            $set: {
                msisdn: req.body.msisdn,
            }
        }, { new: true }, function(error, user) {
            if (error || !user) {
                console.log("/update");
                console.log(error);
                res.status(500).send({ error: error });
            } else {
                res.json({ user: user });
            }
        });
    }
}
