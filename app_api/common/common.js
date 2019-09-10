const debug = require('debug')('onemzone');
const mongoose = require('mongoose');
const moment = require('moment');
const jwt = require('jwt-simple');
const postmark = require("postmark");

const tokenValidity = process.env.TOKEN_VALIDITY || 14 * 24 * 3600;
const User = require('../models/Model').User;

exports.shortNumber = process.env.SHORT_NUMBER || "444100";

/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
exports.createJWT = function (user) {
    var payload = {
        sub: user._id,
        iat: moment().unix(),
        exp: moment().add(tokenValidity, 'seconds').unix()
    };
    return jwt.encode(payload, process.env.TOKEN_SECRET);
}

exports.decodeJWT = function (token, noVerify) {
    var payload, noValidate = false;
    if (noVerify === true) {
        noValidate = true;
    }
    try {
        payload = jwt.decode(token, process.env.TOKEN_SECRET, noValidate);
        return payload;
    }
    catch (err) {
        return false;
    }

}

exports.getUser = function (msisdn) {
    return new Promise(function (resolve, reject) {
        debug("looking up user:" + msisdn);
        User.findOne({ msisdn: msisdn }).then(function (user) {
            if (!user) {
                resolve(undefined);
            } else {
                resolve(user);
            }
        }).catch(function (error) {
            reject(error);
        });
    });
}

exports.sendEmail = function (msisdn, text) {
    var client = new postmark.Client("c1190b96-cdbc-48fc-8606-606514b93115");

    var data = {};
    // var template = new EmailTemplate(data.templateDir);
    data.From = 'ONEm Zone <no-reply@onem.com>';
    data.Subject = "SMS received";
    //data.formData = emailData;

    //  debug("data.firstName:" + data.firstName);

    //template.render(data).then(function(result) {
    exports.getUser(msisdn).then(function (user) {
        // data.HtmlBody = result.html;
        if (!user || !user.email) {
            debug("can't find email user for: " + msisdn);
            return;
        }
        
        if (user.dontSendEmails) return;

        data.TextBody = text;
        data.To = user.email;
        client.sendEmail(data, function (error, body) {
            if (error) {
                debug("sendEmail");
                debug(error);
            }
        });
    }).catch(function(error){
        debug(error);
    });
}

exports.verifyJWT = function (token) {
    var payload = null;
    try {
        payload = jwt.decode(token, process.env.TOKEN_SECRET);
    }
    catch (err) {
        debug(err.message);
        return undefined;
    }

    if (payload.exp <= moment().unix()) {
        return undefined;
    }

    return payload;
}

