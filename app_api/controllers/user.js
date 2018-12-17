var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;

var UserSchema = require('../models/Model').UserSchema;
var User = mongoose.model('users', UserSchema);


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