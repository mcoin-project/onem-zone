const debug = require('debug')('onemzone');
const mongoose = require('mongoose');
const ObjectId = require('mongoose').Types.ObjectId;

const request = require('request');
const common = require('../common/common.js');
const speakeasy = require('speakeasy');

var UserSchema = require('../models/Model').UserSchema;
var User = mongoose.model('users', UserSchema);

exports.googleAuth = function (User) {
  return function (req, res) {

    var accessTokenUrl = 'https://www.googleapis.com/oauth2/v4/token';
    //var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
    var googleJWTToken;

    var params = {
      code: req.body.code,
      client_id: req.body.clientId,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: req.body.redirectUri,
      grant_type: 'authorization_code'
    };

    // Step 1. Exchange authorization code for access token.
    request.post(accessTokenUrl, { json: true, form: params }, function (err, response, token) {
      var accessToken = token.access_token;
      var headers = { Authorization: 'Bearer ' + accessToken };

      googleJWTToken = common.decodeJWT(response.body.id_token, true);
      debug("jwt:");
      debug(googleJWTToken);
      // if (!googleJWTToken.sub) {
      //   return res.status(500).send({ message: 'Cannot retrieve user profile' });
      // }

      // Step 3a. Link user accounts.
      if (googleJWTToken && googleJWTToken.sub && req.header('Authorization')) {
        debug("*** request header ***");
        User.findOne({ google: googleJWTToken.sub }, function (err, existingUser) {
          debug("found existing user - creating jwt token");
          if (existingUser) {
            return res.status(409).send({ message: 'There is already a Google account that belongs to you' });
          }
          var token = req.header('Authorization').split(' ')[1];
          var payload = common.decodeJWT(token);
          User.findById(payload.sub, function (err, user) {
            if (err) {
              debug(err);
              return res.status(500).send({ message: 'Server error' });
            }
            var newUser;
            if (!user) {
              newUser = new User();
              debug('user not found');
              //return res.status(400).send({ message: 'User not found' });
            } else {
              newUser = user;
            }
            newUser.secret = speakeasy.generateSecret({ length: 20 }).base32;;
            newUser.google = googleJWTToken.sub;
            newUser.firstName = newUser.firstName || googleJWTToken.given_name;
            newUser.lastName = newUser.lastName || googleJWTToken.family_name;
            newUser.email = newUser.email || googleJWTToken.email;
            newUser.save(function (err, user) {
              if (err) {
                debug(err);
                return res.status(500).send({ message: 'Server error' });
              }
              debug("creating jwt (existing token)");
              debug(user);
              if (!user) {
                debug(err);
                return res.status(400).send({ message: 'User not found' });
              }
              var token = common.createJWT(newUser);
              res.send({ token: token });
            });
          });
        });
      } else {
        // Step 3b. Create a new user account or return an existing one.
        User.findOne({ google: googleJWTToken.sub }, function (err, existingUser) {
          if (existingUser && existingUser.email) {
            debug("creating jwt (no token)");
            debug(user);
            return res.send({ token: common.createJWT(existingUser) });
          }
          var user = new User();
          user.secret = speakeasy.generateSecret({ length: 20 }).base32;
          user.google = googleJWTToken.sub;
          user.firstName = user.firstName || googleJWTToken.given_name;
          user.lastName = user.lastName || googleJWTToken.family_name;
          user.email = user.email || googleJWTToken.email;
          user.save(function (err, user) {
            if (err) {
              debug(err);
              return res.status(400).send({ message: 'User not saved' });
            }
            debug("creating jwt");
            debug(user);
            var token = common.createJWT(user);
            res.send({ token: token });
          });
        });
      }
    });
  };
};

exports.facebookAuth = function (User) {
  return function (req, res) {
    /*
 |--------------------------------------------------------------------------
 | Login with Facebook
 |--------------------------------------------------------------------------
 */
    var fields = ['id', 'email', 'first_name', 'last_name', 'link', 'name'];
    var accessTokenUrl = 'https://graph.facebook.com/v2.5/oauth/access_token';
    var graphApiUrl = 'https://graph.facebook.com/v2.5/me?fields=' + fields.join(',');
    var params = {
      code: req.body.code,
      client_id: req.body.clientId,
      client_secret: process.env.FACEBOOK_SECRET,
      redirect_uri: req.body.redirectUri
    };

    // Step 1. Exchange authorization code for access token.
    request.get({ url: accessTokenUrl, qs: params, json: true }, function (err, response, accessToken) {
      if (response.statusCode !== 200) {
        return res.status(500).send({ message: accessToken.error.message });
      }

      // Step 2. Retrieve profile information about the current user.
      request.get({ url: graphApiUrl, qs: accessToken, json: true }, function (err, response, profile) {
        if (response.statusCode !== 200) {
          return res.status(500).send({ message: profile.error.message });
        }
        if (req.header('Authorization')) {
          User.findOne({ facebook: profile.id }, function (err, existingUser) {
            if (existingUser) {
              return res.status(409).send({ message: 'There is already a Facebook account that belongs to you' });
            }
            var token = req.header('Authorization').split(' ')[1];
            var payload = common.decodeJWT(token, true);
            debug(" fb payload");
            debug(payload);

            User.findById(payload.sub, function (err, user) {
              if (!user) {
                return res.status(400).send({ message: 'User not found' });
              }
              user.facebook = profile.id;
              user.firstName = user.firstName || profile.first_name;
              user.lastName = user.lastName || profile.last_name;
              user.email = user.email || profile.email;
              user.save(function () {
                var token = common.createJWT(user);
                res.send({ token: token });
              });
            });
          });
        } else {
          debug("no auth header");
          // Step 3. Create a new user account or return an existing one.
          debug(" fb profile");
          debug(profile);

          User.findOne({ facebook: profile.id }, function (err, existingUser) {
            if (existingUser && existingUser.email) {
              var token = common.createJWT(existingUser);
              return res.send({ token: token });
            }
            var user = new User();
            user.firstName = user.firstName || profile.first_name;
            user.lastName = user.lastName || profile.last_name;
            user.email = user.email || profile.email;
            user.save(function (err) {
              if (err) debug(err);
              var token = common.createJWT(user);
              res.send({ token: token });
            });
          });
        }
      });
    });
  }
}