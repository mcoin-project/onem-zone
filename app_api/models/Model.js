
var Mongoose = require('mongoose');

exports.UserSchema = new Mongoose.Schema({
    email: { type: String, lowercase: true, minlength: 6, maxlength: 254 },
    firstName: { type: String }, // required: true, minlength: 2, maxlength: 50 },
    lastName: { type: String }, // required: true, minlength: 2, maxlength: 50 },
    blocked: { type: Boolean, default: false },
    secret: { type: String, select: false }, // totp secret
    msisdn: { type: String, minlength: 6, maxlength: 20 },
    facebook: { type: String, unique: true, index: true, sparse: true },
    google: { type: String, unique: true, index: true, sparse: true },
    lastLogin: { type: Date, default: Date.now },
    invalidLoginCount: { type: Number, default: 0 },
    touchMode: { type: Boolean, default: false },
    dontSendEmails: { type: Boolean, default: false } // made this default false so no need to migrate old users
    //    github: String,
    //    instagram: String,
    //    linkedin: String,
    //    live: String,
    //    yahoo: String,
    //    twitter: String,
    //    twitch: String,
    //    spotify: String,
    //    foursquare: String,
    //   picture: String,
    //   bitbucket: String,
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

exports.DeveloperSchema = new Mongoose.Schema({
    _user: { // the one to whom the bonus is due
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    apiKey: { type: String, required: true, unique: true }
}, {
    timestamps: true
});

exports.ServiceSchema = new Mongoose.Schema({
    name: { type: String, lowercase: true, minlength: 3, maxlength: 20, unique: true, required: true },
    _developer: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'developers'
    }
}, {
    timestamps: true
});

exports.VerbSchema = new Mongoose.Schema({
    name: { type: String, lowercase: true, minlength: 3, maxlength: 20, required: true },
    _service: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'services',
        required: true
    },
    route: { type: String, required: true },
    footer: { type: Boolean, default: false }
}, {
    timestamps: true
});
