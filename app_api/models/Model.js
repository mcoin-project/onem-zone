
var Mongoose = require('mongoose');

var UserSchema = new Mongoose.Schema({
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

exports.User = Mongoose.model('users', UserSchema);

var MessageSchema = new Mongoose.Schema({
    _user: { 
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

exports.Message = Mongoose.model('messages', MessageSchema);


var DeveloperSchema = new Mongoose.Schema({
    _user: { // the one to whom the bonus is due
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    apiKey: { type: String, required: true, unique: true }
}, {
        timestamps: true
    });

exports.Developer = Mongoose.model('developers', DeveloperSchema);


var DeveloperServiceSchema = new Mongoose.Schema({
    callbackPath: { type: String, required: true },
    _developer: {
        type: Mongoose.Schema.Types.ObjectId,
        ref: 'developers',
        required: true
    },
    name: { type: String, lowercase: true, minlength: 3, maxlength: 20, required: true },  
},{
        timestamps: true
    });
exports.Service = Mongoose.model('services', DeveloperServiceSchema);


var ServiceSchema = new Mongoose.Schema({
    names: [{ type: String, lowercase: true, minlength: 3, maxlength: 20 }],
    icon: { type: String, required: true },
    template: { type: String },
    blockRequest: { type: Boolean },
    always: { type: Boolean },
    default: { type: Boolean }
});
    
exports.ServicesList = Mongoose.model('serviceslist', ServiceSchema);

var VerbSchema = new Mongoose.Schema({
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

exports.Verb = Mongoose.model('verbs', VerbSchema);
