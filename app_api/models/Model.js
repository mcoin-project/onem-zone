
var Mongoose = require('mongoose');

exports.UserSchema = new Mongoose.Schema({
    email: { type: String, lowercase: true, minlength: 6, maxlength: 254 },
    firstName: { type: String }, // required: true, minlength: 2, maxlength: 50 },
    lastName: { type: String }, // required: true, minlength: 2, maxlength: 50 },
    blocked: { type: Boolean, default: false },
    secret: { type: String, select: false }, // totp secret
    msisdn: { type: String, minlength: 6, maxlength: 20 },
    //   picture: String,
    //   bitbucket: String,
    facebook: { type: String, unique: true, index: true, sparse: true },
    campaign: String,
    //    foursquare: String,
    google: { type: String, unique: true, index: true, sparse: true },
    //    github: String,
    //    instagram: String,
    //    linkedin: String,
    //    live: String,
    //    yahoo: String,
    //    twitter: String,
    //    twitch: String,
    //    spotify: String
    lastLogin: { type: Date, default: Date.now },
    invalidLoginCount: { type: Number, default: 0 },
}, {
    timestamps: true
});

exports.MessageSchema = new Mongoose.Schema({
    _user: { // the one to whom the bonus is due
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    from: { type: String, required: true },
    to: { type: String, required: true },
    text: { type: String, required: true },
    delivered: { type: Boolean, required: true }
}, {
    timestamps: true
});
