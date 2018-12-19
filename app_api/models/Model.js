var Mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var crypto = require('crypto');

Mongoose.Promise = require('bluebird');

exports.UserSchema = new Mongoose.Schema({
    email: { type: String, lowercase: true, minlength: 6, maxlength: 254 },
    password: { type: String, select: false, required: false },
    firstName: { type: String }, // required: true, minlength: 2, maxlength: 50 },
    lastName: { type: String }, // required: true, minlength: 2, maxlength: 50 },
    blocked: { type: Boolean, default: false },
    secret: { type: String, select: false }, // totp secret
    msisdn: { type: String, minlength: 6, maxlength: 20 },
    //   picture: String,
    //   bitbucket: String,
    facebook: String,
    campaign: String,
    //    foursquare: String,
    google: { type: String, unique: true },
    //    github: String,
    //    instagram: String,
    //    linkedin: String,
    //    live: String,
    //    yahoo: String,
    //    twitter: String,
    //    twitch: String,
    //    spotify: String
    lastLogin: { type: Date, default: Date.now },
    tokenTimestamp: Date,
    invalidLoginCount: { type: Number, default: 0 },
    emailToken: { type: String, select: false, default: null },
    emailTokenTime: { type: Date, select: false, default: null }
}, {
    timestamps: true
});

exports.UserSchema.pre('save', function(next) {
    var user = this;
    if (!user.isModified('password')) {
        return next();
    }
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(user.password, salt, function(err, hash) {
            user.password = hash;
            next();
        });
    });
});

exports.UserSchema.methods.comparePassword = function(password, done) {
    bcrypt.compare(password, this.password, function(err, isMatch) {
        done(err, isMatch);
    });
};
