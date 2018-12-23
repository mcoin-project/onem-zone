const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;
const common = require('../common/common.js');

var UserSchema = require('../models/Model').UserSchema;
var User = mongoose.model('users', UserSchema);

var MessageSchema = require('../models/Model').MessageSchema;
var Message = mongoose.model('messages', MessageSchema);

var bluebird = require('bluebird');

exports.save = function (from, to, text) {
    console.log("messages.save");
    console.log("from: " + from + ' to:' + to);
    common.getUser(to).then(function (user) {
        var message = new Message();
        message._user = user._id;
        message.from = from;
        message.to = to;
        message.text = text;
        message.delivered = false;
        return message.save();
    }).catch(function (error) {
        console.log("/message.save");
        console.log(error);
        return new Error(error);
    });
}

exports.deliverPending = function (socket) {
    return new Promise(function (resolve, reject) {
        if (!socket.msisdn) {
            console.log("msisdn missing");
            return reject("msisdn missing");
        }
        common.getUser(socket.msisdn).then(function (user) {
            Message.updateMany({ _user: user._id, delivered: false }, { $set: { delivered: true } }).then(function (users) {
                users.map(function (user) {
                    socket.emit('MT SMS', { mtText: user.text });
                });
            }).catch(function (error) {
                reject(error);
            })
        })
    });
}