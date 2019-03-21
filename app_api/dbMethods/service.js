const mongoose = require('mongoose');
const debug = require('debug')('onemzone');

var ServiceSchema = require('../models/Model').ServiceSchema;
var Service = mongoose.model('services', ServiceSchema);

exports.Service = function(name) {
    if (name.startsWith('#')) {
        this.name = name.substring(1,name.length);
    } else {
        this.name = name;
    }
}

exports.Service.prototype.get = function() {
    debug("looking for service: " + this.name);
    return Service.findOne({name: this.name}).populate('_developer');
}
