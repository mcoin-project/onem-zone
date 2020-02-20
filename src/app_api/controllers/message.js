const debug = require('debug')('onemzone');
const mongoose = require('mongoose');
const common = require('../common/common.js');

var Message = require('../models/Model').Message;

exports.save = function (from, to, text) {
    debug("messages.save");
    debug("from: " + from + ' to:' + to);
    common.getUser(to).then(function (user) {
        if (!user) throw "no user found for:" + to;
        var message = new Message();
        message._user = user._id;
        message.from = from;
        message.to = to;
        message.text = text;
        message.delivered = false;
        return message.save();
    }).catch(function (error) {
        debug("/message.save");
        debug(error);
        return new Error(error);
    });
}

exports.deliverPending = function (socket) {
    return new Promise(function (resolve, reject) {
        var savedUser;
        if (!socket.msisdn) {
            debug("msisdn missing");
            return reject("msisdn missing");
        }
        common.getUser(socket.msisdn).then(function (user) {
            debug("got user:");
            debug(user);
            savedUser = user;
            return Message.find({ _user: user._id, delivered: false});
        }).then(function(users) {
            if (users && users.length > 0) {
                debug("there are pending messages to deliver");
                users.map(function (user) {
                    socket.emit('INBOX MT SMS', { mtText: user.text });
                });
                return Message.updateMany({ _user: savedUser._id, delivered: false }, { $set: { delivered: true } });
            } else {
                return true;
            }
        }).then(function () {
            resolve(true);
        }).catch(function (error) {
            debug(error);
            reject(error);
        })
    });
}