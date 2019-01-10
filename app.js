require('dotenv').load();

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var logger = require('morgan');
var path = require('path');
var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var helmet = require('helmet');

var common = require('./app_api/common/common.js');

// Bring in the routes for the API (delete the default routes)
var routesApi = require('./app_api/routes/index.js');
var io = require('./app_api/common/io.js');

// The http server will listen to an appropriate port, or default to
// port 5000.
var theport = process.env.PORT || 5000;
var mode = process.argv[2] || 'dev';
mode = mode.toLowerCase();
var public_folder = mode == 'prod' ? 'public' : 'app_client';

console.log("public_folder:" + public_folder);

console.log("mode:"+mode);
if (mode == 'prod') {
    app.use(helmet());  
    app.use(helmet.noCache());
}
app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, public_folder)));

//The message state to be used in receipts:
// Bring in the data model & connect to db
require('./app_api/models/db');

io.initialize(server);

// app.use(function(req, res, next) { //allow cross origin requests
//     res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
//     res.header("Access-Control-Allow-Origin", "http://localhost");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });

// Use the API routes when path starts with /api
app.use('/api', routesApi);

app.get('/', function(req, res, next) {
    res.sendFile('/' + public_folder + '/index.html', { root: __dirname });
});

app.get('*', function(req, res) {
    res.sendFile('/' + public_folder + '/index.html', { root: __dirname });
});

app.get('/*', function(req, res, next) {
    console.log("caught default route");
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('/' + public_folder + '/index.html', { root: __dirname });
});

// error handling middleware should be loaded after the loading the routes
if ('development' == app.get('env')) {
    app.use(errorHandler());
}
server.listen(theport);
console.log("listening on port:" + theport)

module.exports = app;