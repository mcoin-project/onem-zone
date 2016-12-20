var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');
var request = require('request');
var fs = require('fs');
var _ = require('underscore');
var NodeCache = require("node-cache");

var menuOptions = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
var menuFooter = '<send option>';

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

app.use(cookieParser());

app.use(session({
    secret: '0nems1m',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 360000 } // 24 hours
}));

// Use the API routes when path starts with /api
app.use('/api', routesApi);

app.use(express.static(path.join(__dirname, 'public')));

function getMenuResponse(input, menu) {

    var response = '';

    for (var i = 0; i < menu.length; i++) {
        response = response + menuOptions[i] + ' ' + menu[i].description + '\n';
    }

    return response;
}

function serviceSwitch(context, input) {

    var root = './app_api/json/';
    var fileName = '';
    var fullPath = '';
    var response = '';

    switch (input) {
        case '#onem':
        case '#':
            fileName = 'onem.json';
            break;
        default:
            fileName = input.slice(1) + '.json';
            break;
    }

    fullPath = root + fileName;

    console.log("reading: " + fileName);

    try {
        var index = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        console.log("index.content.length:" + index.content.length);
        if (typeof index !== 'undefined') {
            // context = index.content[0];
            context = JSON.parse(JSON.stringify(index.content[0]));
            console.log("context");
            console.log(context);
        }
    } catch (err) {
        response = "error, service not found";
    }

    return context;

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

function validateInput(moText, context) {

    var input = moText.toLowerCase();
    var response = { success: true };

    switch (context.type) {
        case 'menu':
            var menuContent = context.content;

            // if it's only 1 char long and in range of a to last menu option
            var found = menuOptions.indexOf(input[0]);
            if (input.length === 1 &&
                found !== -1 &&
                found >= menuContent.length &&
                found <= menuContent.length) {
                response.success = true;
                response.firstOption = 'a';
                response.lastOption = menuOptions[menuContent.length];
            } else {
                response.success = false;
            }
            break;
        default:
            break;

    }

    return response;

}

function processHeader(context) {
    var header = '';
    if (typeof context.header !== 'undefined') {
        header = context.header + '\n';
    }
    return header;
}

function processFooter(context) {
    return menuFooter;
}


app.get('/api/getResponse', function(req, res) {

    var moText = req.query.moText.trim();
    var response = '';
    var header = '';
    var footer = '';
    var firstChar = '';
    var firstTime = false;
    var context = req.session.onemContext;
    var verb = false;
    var status = {success : true };

    console.log(req.session);

    if (moText.length === 0) return res.json({ mtText: '' });

    if (typeof context === 'undefined') { // must be first time, or expired
        console.log("First time login or session expired");
        req.session.onemContext = { fileName :'onem.json' };
        context = req.session.onemContext;
        context.savedContext = {};
        moText = "#onem";
        firstTime = true;
    }

    firstChar = moText[0].toLowerCase();

    // check MO request for reserved verbs or service switching
    switch (true) {
        case (firstChar == '#'):
            console.log("service switch");
            context.savedContext = serviceSwitch(context.savedContext, moText);
            verb = true;
            break;
        case (moText === 'menu'):
            console.log("menu selected");
            verb = true;
            break;
        case (moText === 'back'):
            console.log("back selected");
            verb = true;
            break;
        default:
            console.log("other");
            break;
    }

    // if it's not a reserved word, then validate the input against the savedContext
    // eg if it's a menu option, check the selected option value
    // if it's an input string, then accept anything else (other than a reserved verb)
    if (!verb && !firstTime) {
        status = validateInput(moText, context.savedContext);
    }

    response = processRequest(moText, context.savedContext);

    console.log("status.success:"+status.success);

    if (status.success) {
        header = processHeader(context.savedContext);
        footer = processFooter(context.savedContext);
    }

//    console.log("after");
//    console.log(context.savedContext);

    var finalResponse = header + response + footer;

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