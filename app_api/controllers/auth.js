const request = require('request');
const common = require('../common/common.js');

exports.googleAuth = function(User) {
    return function(req, res) {

        var accessTokenUrl = 'https://accounts.google.com/o/oauth2/token';
        var peopleApiUrl = 'https://www.googleapis.com/plus/v1/people/me/openIdConnect';
        var params = {
          code: req.body.code,
          client_id: req.body.clientId,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: req.body.redirectUri,
          grant_type: 'authorization_code'
        };
      
        // Step 1. Exchange authorization code for access token.
        request.post(accessTokenUrl, { json: true, form: params }, function(err, response, token) {
          var accessToken = token.access_token;
          var headers = { Authorization: 'Bearer ' + accessToken };
      
          // Step 2. Retrieve profile information about the current user.
          request.get({ url: peopleApiUrl, headers: headers, json: true }, function(err, response, profile) {
            console.log("got response from google");
            console.log(profile);
            if (profile.error) {
              return res.status(500).send({message: profile.error.message});
            }
            // Step 3a. Link user accounts.
            if (req.header('Authorization')) {
              User.findOne({ google: profile.sub }, function(err, existingUser) {
                if (existingUser) {
                  return res.status(409).send({ message: 'There is already a Google account that belongs to you' });
                }
                var token = req.header('Authorization').split(' ')[1];
                var payload = common.decodeJWT(token);
                User.findById(payload.sub, function(err, user) {
                  if (!user) {
                    return res.status(400).send({ message: 'User not found' });
                  }
                  user.google = profile.sub;
                  user.firstName = user.firstName || profile.given_name;
                  user.lastName = user.lastName || profile.family_name;
                  user.email = user.email || profile.email;
                  user.save(function() {
                    console.log("creating jwt (existing token)");
                    console.log(user);
                    var token = common.createJWT(user);
                    res.send({ token: token });
                  });
                });
              });
            } else {
              // Step 3b. Create a new user account or return an existing one.
              User.findOne({ google: profile.sub }, function(err, existingUser) {
                if (existingUser) {
                  console.log("creating jwt (no token)");
                  console.log(user);
                  return res.send({ token: common.createJWT(existingUser) });
                }
                var user = new User();
                user.google = profile.sub;
                user.firstName = user.firstName || profile.given_name;
                user.lastName = user.lastName || profile.family_name;
                user.email = user.email || profile.email;
                user.save(function(err, user) {
                  if (err) console.log(err);
                  console.log("creating jwt");
                  console.log(user);
                  var token = common.createJWT(user);
                  res.send({ token: token });
                });
              });
            }
          });
        });
    };
};