const moment = require('moment');
const jwt = require('jwt-simple');
const tokenValidity = process.env.TOKEN_VALIDITY || 14 * 24 * 3600;

exports.shortNumber = process.env.SHORT_NUMBER || "444100";

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

