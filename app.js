var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');
var request = require('request');
var fs = require('fs');
var _ = require('underscore');
var NodeCache = require("node-cache");
var index = new NodeCache();

var app = express();

// Bring in the routes for the API (delete the default routes)
var routesApi = require('./app_api/routes/index.js');

// Bring in the data model & connect to db
// require('./app_api/models/db');

// The http server will listen to an appropriate port, or default to
// port 5000.
var theport = process.env.PORT || 5000;

app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());

// Use the API routes when path starts with /api
app.use('/api', routesApi);

app.use(express.static(path.join(__dirname, 'public')));

index = JSON.parse(fs.readFileSync('./app_api/json/index.json', 'utf8'));

console.log("index.content.length:" + index.content.length);

var flowStep = 0;
var savedContext = index.content[flowStep];
var firstTime = true;

function getMenuResponse(input, menu) {

    var response = '';

    _.each(menu, function(option) {
        response = response + option.description + '\n';
    });

    return response;
}

function serviceSwitch(input) {

    var fileName = './app_api/json/';
    var response = '';

    switch (input) {
        case '#onem':
        case '#':
            fileName = fileName + 'index.json';
            break;
        default:
            fileName = fileName + input.slice(1) + '.json';
            break;
    }

    console.log("reading: "+fileName);

    try {
        index = JSON.parse(fs.readFileSync(fileName, 'utf8'));
        console.log("index.content.length:" + index.content.length);
        savedContext = index.content[0];
    } catch (err) {
		response = "error, service not found";
    }

}

function processRequest(input, context) {

    var response = '';

    switch (context.type) {
        case 'menu':
            var menuContent = context.content;
            response = getMenuResponse(input, menuContent);
            console.log("switched menu context");
            break;
        default:
            break;
    }

    return response;

}

app.get('/api/getResponse', function(req, res) {

    var moText = req.query.moText.trim().toLowerCase();
    var response = '';
    var header = '';

    if (moText.length === 0) return res.json({ mtText: '' });

    if (firstTime) {
        moText = "#index";
        firstTime = false;
    }

    // check MO request

    switch (true) {
        case (moText[0] == '#'):
            console.log("service switch");
            serviceSwitch(moText);
            break;
        case (moText[0] >= 'a' && moText[0] <= 'z'):
        case (moText[0] >= '1' && moText[0] <= '9'):
            console.log("menu option");
            break;
        case (moText === 'menu'):

			break;
        default:
            console.log("other");
            break;
    }

    console.log("before");
    console.log(savedContext);


    if (typeof savedContext.header !== 'undefined') {
        header = savedContext.header + '\n';
    }

    response = processRequest(moText, savedContext);

    console.log("after");
    console.log(savedContext);

    var finalResponse = header + response;

    res.json({ mtText: finalResponse });
});


app.get('/', function(req, res, next) {
    res.sendFile('/public/views/index.html', { root: __dirname });
});

app.get('*', function(req, res) {
    res.sendFile('/public/views/index.html', { root: __dirname });
});

app.get('/*', function(req, res, next) {
    console.log("caught default route");
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('/public/views/index.html', { root: __dirname });
});

// error handling middleware should be loaded after the loading the routes
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

var server = http.createServer(app);
server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});

module.exports = app;