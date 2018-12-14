const moment = require('moment');
const jwt = require('jwt-simple');
const tokenValidity = process.env.TOKEN_VALIDITY || 14 * 24 * 3600;
var mongoose = require('mongoose');
var ObjectId = require('mongoose').Types.ObjectId;

var UserSchema = require('../models/Model').UserSchema;
var User = mongoose.model('users', UserSchema);
/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
exports.createJWT = function(user) {
    var payload = {
      sub: user._id,
      iat: moment().unix(),
      exp: moment().add(tokenValidity, 'seconds').unix()
    };
    return jwt.encode(payload, process.env.TOKEN_SECRET);
}

exports.decodeJWT = function(token) {
    var payload;
    try {
        payload = jwt.decode(token, process.env.TOKEN_SECRET);
        return payload;
    }
    catch (err) {
        return false;
    }
     
}

exports.verifyJWT = function(token) {
  var payload = null;
  try {
      payload = jwt.decode(token, process.env.TOKEN_SECRET);
  }
  catch (err) {
      console.log(err.message);
      return undefined;
  }

  if (payload.exp <= moment().unix()) {
      return undefined;
  }

  return payload;
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