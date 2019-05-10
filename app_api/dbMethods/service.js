const debug = require('debug')('onemzone');

var ServicesList = require('../models/Model').ServicesList;
var Service = require('../models/Model').Service;
var Verb = require('../models/Model').Verb;

exports.Service = function (name) {
    if (name.startsWith('#')) {
        this.name = name.substring(1, name.length);
    } else {
        this.name = name;
    }
}

exports.Service.prototype.get = async function () {
    //debug("looking for service: " + this.name);
    return Service.findOne({ name: this.name }).populate('_developer');
}

exports.Service.prototype.getVerbs = async function () {
    debug("looking up service: " + this.name);
    try {
        var s = await Service.findOne({ name: this.name });
        if (!s) throw { code: 200, message: 'no service with name: ' + service }
        var verbs = await Verb.find({ _service: s._id }).select('name route footer').lean();
        // debug("result from service lookup:");
        for (var i = 0; i < verbs.length; i++) {
            delete verbs[i]._id;
        }
        return verbs;
    } catch (error) {
        debug(error);
        if (error.code == 200) return [];
        throw error;
    };
}

// returns true if @name is found in serviceslist collection
exports.serviceIncludes = async function (name) {
    if (arguments.length !== 1 || !name) return false;

    var n = name;
    if (name.startsWith('#')) {
        n = n.slice(1);
    }
    var s = await Service.findOne({ name: n });

    return s ? true : false;
}
