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
      console.log("jwt:");
      console.log(googleJWTToken);
      // if (!googleJWTToken.sub) {
      //   return res.status(500).send({ message: 'Cannot retrieve user profile' });
      // }

      // Step 3a. Link user accounts.
      if (googleJWTToken && googleJWTToken.sub && req.header('Authorization')) {
        console.log("*** request header ***");
        User.findOne({ google: googleJWTToken.sub }, function (err, existingUser) {
          console.log("found existing user - creating jwt token");
          if (existingUser) {
            return res.status(409).send({ message: 'There is already a Google account that belongs to you' });
          }
          var token = req.header('Authorization').split(' ')[1];
          var payload = common.decodeJWT(token);
          User.findById(payload.sub, function (err, user) {
            if (err) {
              console.log(err);
              return res.status(500).send({ message: 'Server error' });
            }
            var newUser;
            if (!user) {
              newUser = new User();
              console.log('user not found');
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
                console.log(err);
                return res.status(500).send({ message: 'Server error' });
              }
              console.log("creating jwt (existing token)");
              console.log(user);
              if (!user) {
                console.log(err);
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
            console.log("creating jwt (no token)");
            console.log(user);
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
              console.log(err);
              return res.status(400).send({ message: 'User not saved' });
            }
            console.log("creating jwt");
            console.log(user);
            var token = common.createJWT(user);
            res.send({ token: token });
          });
        });
      }
    });
  };
};