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

// returns
// {
//    success : true || false,
//    data : context
//    response : error text
// }
function serviceSwitch(input) {

    var root = './app_api/json/';
    var fileName = '';
    var fullPath = '';
    var response = '';
    var context = { success: false, data: undefined, response: '' };

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

    try {
        var index = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (typeof index !== 'undefined') {
            context.data = JSON.parse(JSON.stringify(index));
            context.data.indexPos = 0;
            context.success = true;
        } else {
            context.response = "error, service not found";
        }
    } catch (err) {
        context.response = "error, service not found";
    }

    return context;

}

function processRequest(input, context) {

    var response = '';
    var i = context.indexPos;
    var type = '';

    if (context.content instanceof Array) {
        console.log("content is a array");
        type = context.content[i].type;
    } else {
        console.log("content is not an array");
        type = context.content.type;
    }

    switch (type) {
        case 'menu':
            response = getMenuResponse(input, context.content[i].content);
            break;
        case 'input':
            console.log("type input:");
            console.log(context.content[i].content.description);
            response = context.content[i].content.description + '\n';
            break;
        default:
            break;
    }

    return response;

}

function validateInput(moText, context) {

    var input = moText.toLowerCase();
    var response = { success: true };
    var i = context.indexPos;
    var type = '';

    if (context.content instanceof Array) {
        console.log("content is a array");
        type = context.content[i].type;
    } else {
        console.log("content is not an array");
        type = context.content.type;
    }

    console.log("validating input:"+ moText);
    console.log("type:"+type);
    console.log("index:" + i);

    switch (type) {
        case 'menu':
            var menuContent = context.content[i].content;

            console.log("menuContent:");
            console.log(menuContent);

            // if it's only 1 char long and in range of a to last menu option
            var found = menuOptions.indexOf(input[0]);
            console.log("found:"+found);
            if (input.length === 1 &&
                found !== -1 &&
                found <= menuContent.length -1) {
                response.success = true;
                response.firstOption = 'a';
                response.lastOption = menuOptions[menuContent.length-1];
            } else {
                response.success = false;
                response.response = "invalid menu option";
            }
            break;
        case 'input':
            console.log('input found');
            response.success = true;
            break;
        default:
            break;

    }

    return response;

}

function processHeader(content) {
    var header = '';

    if (typeof content.header !== 'undefined') {
        header = content.header + '\n';
    }
    return header;
}

function processFooter(content) {
    return menuFooter;
}


app.get('/api/getResponse', function(req, res) {

    var moText = req.query.moText.trim();
    var response = '';
    var header = '';
    var footer = '';
    var firstChar = '';
    var firstTime = false;
    var serviceSwitched = false;
    var verb = false;
    var status = { success: true };
    var i;

    if (moText.length === 0) return res.json({ mtText: '' });

    if (typeof req.session.onemContext === 'undefined') { // must be first time, or expired
        req.session.onemContext = { fileName: 'onem.json' };
        req.session.onemContext.indexPos = 0;
        moText = "#onem";
        firstTime = true;
    }

    i = req.session.onemContext.indexPos;

    firstChar = moText[0].toLowerCase();

    // check MO request for reserved verbs or service switching
    switch (true) {
        case (firstChar == '#'):
            var result = serviceSwitch(moText);
            if (result.success) {
                verb = true;
                serviceSwitched = true;
                req.session.onemContext = result.data;
                req.session.onemContext.indexPos = 0;
                i = 0;
            } else {
                status.success = false;
                status.response = result.response;
            }
            break;
        case (moText === 'menu'):
            if (req.session.onemContext.content[i].type !== 'menu') {
                status.success = false;
            } else {
                verb = true;
            }
            break;
        case (moText === 'back'):
            verb = true;
            break;
        default:
            break;
    }

    // if it's not a reserved word, then validate the input against the savedContext
    // eg if it's a menu option, check the selected option value
    // if it's an input string, then accept anything else (other than a reserved verb)
    if (!verb && !firstTime && status.success) {
        status = validateInput(moText, req.session.onemContext);
        console.log("after validated input, status:");
        console.log(status);
    }


    if (status.success) {
        if (!firstTime && !serviceSwitched) {
            req.session.onemContext.indexPos++;
            i = req.session.onemContext.indexPos;
            console.log("incrementing index, now:"+i);
        }

        header = processHeader(req.session.onemContext.content[i]);
        status.response = processRequest(moText, req.session.onemContext);
        footer = processFooter(req.session.onemContext.content[i]);


    }

    var finalResponse = header + status.response + footer;

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