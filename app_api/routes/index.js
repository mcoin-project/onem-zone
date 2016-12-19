var _ = require('underscore-node');
var express = require('express');
var mongoose = require('bluebird').promisifyAll(require('mongoose'));

var api = express.Router();
module.exports = api;