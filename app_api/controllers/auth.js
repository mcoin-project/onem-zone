const request = require('request');
const jwt = require('jwt-simple');
const moment = require('moment');
/*
 |--------------------------------------------------------------------------
 | Generate JSON Web Token
 |--------------------------------------------------------------------------
 */
function createJWT(user) {
    var payload = {
      sub: user._id,
      iat: moment().unix(),
      exp: moment().add(14, 'days').unix()
    };
    return jwt.encode(payload, process.env.TOKEN_SECRET);
}

exports.signUp = function(User) {
    return function(req, res) {

        User.findOne({ email: req.body.email.toLowerCase() }, function(err, existingUser) {

            if (existingUser) {
                return res.status(409).send({ message: 'User already exists, try logging in' });
            }

            // TODO sanitize the body

            var user = new User({
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email.toLowerCase(),
                mobile: req.body.mobile,
                country: req.body.country,
                language: req.body.language,
                campaign: req.body.campaign
            });

            user.lastLogin = new Date().toUTCString();
            user.password = Math.random().toString(36).substr(2, 20); // the mongodb preschema will execute brcrypt with salt!

            user.referralCode = Math.random().toString(36).substr(2, 5).toUpperCase();

            user.save(function(err, user) {

                if (err) {
                    console.log("/signup")
                    console.log(err);
                    return res.status(409).send({ message: err });
                }
                common.generatePasswordToken(user._id, 'signup');
                res.status(200).send({ message: "success" });
            });
        });
    };
};

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
                var payload = jwt.decode(token, config.TOKEN_SECRET);
                User.findById(payload.sub, function(err, user) {
                  if (!user) {
                    return res.status(400).send({ message: 'User not found' });
                  }
                  user.google = profile.sub;
                  user.picture = user.picture || profile.picture.replace('sz=50', 'sz=200');
                  user.displayName = user.displayName || profile.name;
                  user.save(function() {
                    var token = createJWT(user);
                    res.send({ token: token });
                  });
                });
              });
            } else {
              // Step 3b. Create a new user account or return an existing one.
              User.findOne({ google: profile.sub }, function(err, existingUser) {
                if (existingUser) {
                  return res.send({ token: createJWT(existingUser) });
                }
                var user = new User();
                user.google = profile.sub;
                user.picture = profile.picture.replace('sz=50', 'sz=200');
                user.displayName = profile.name;
                user.save(function(err) {
                  var token = createJWT(user);
                  res.send({ token: token });
                });
              });
            }
          });
        });
    };
};