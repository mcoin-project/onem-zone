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
var menuFooter = 'send option';

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

function getWizardResponse(input, menu) {

    var response = 'a Confirm\nb Back\nYou selected:\n';

    for (var i = 0; i < menu.length; i++) {
        response = response + menuOptions[i + 2] + ' ' + menu[i].description + '\n';
    }

    console.log("inside wizard returning:" + response);

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
    var context = { success: false, data: null, response: '' };
    var file;

    var fileExtended = input.replace(/ /g, '/');

    console.log("fileExtended:" + fileExtended);

    if (input[0] === '#') {

        switch (input) {
            case '#':
                fileName = 'index.json';
                break;
            case '#onem':
                fileName = 'onem.json';
                break;
            default:
                fileName = fileExtended.slice(1).toLowerCase() + '.json';
                break;
        }
    } else {
        fileName = input;
    }

    fullPath = root + fileName;

    console.log("fullPath:" + fullPath);

    try {
        file = fs.readFileSync(fullPath, 'utf8');
        context.success = true;
    } catch (err) {
        console.log(err);
        context.response = "Not sure what you meant. Please send # to see all available services.\n";
        context.success = false;
    }

    if (context.success) {
        try {
            var index = JSON.parse(file);
            if (typeof index !== 'undefined') {
                context.success = true;
                context.data = JSON.parse(JSON.stringify(index));
                context.data.indexPos = 0;
            } else {
                console.log("invalid json 1");
                context.response = "Invalid JSON detected: " + fileName;
                context.success = false;
            }
        } catch (err) {
            console.log("error:" + err);
            console.log("invalid json 2");
            context.response = "Invalid JSON detected: " + fileName;
            context.success = false;
        }
    }

    return context;

}

function processMenuContext(input, context) {

    var i = context.indexPos;
    var result = { success: false, data: { indexPos: 0 } };
    var switchRes;

    var option = menuOptions.indexOf(input);

    var selected = context.content[i].content[option];

    console.log("option:" + option);
    console.log("inside processMenuRequest, context.content[i].content[option]:");
    console.log(selected);

    switch (selected.type) {
        case 'linkStatic':
        case 'linkDynamic':
            console.log(selected.ref);
            switchRes = serviceSwitch(selected.ref);
            console.log("switchRes");
            console.log(switchRes);

            if (switchRes.success) {
                result.data = JSON.parse(JSON.stringify(switchRes.data));
                result.data.indexPos = 0;
                result.success = true;
                console.log("result");
                console.log(result);
            } else {
                result.response = switchRes.response;
            }
            break;
        case 'skip':
            console.log("skipping");
            context.indexPos++;
            result.data = context;
            console.log("index:" + result.data.indexPos);
            result.success = true;
            break;
        default:
            break;
    }

    return result;

}


// main handler for responses 
// returns {response : main body of text without header or footer
//          skip: tells main logic whether to skip to the next json item, ie not wait for a response from the user}

function processRequest(input, context) {

    var result = { response: '', skip: false, newContext: false, context: null };
    var i = context.indexPos;
    var type = '';

    console.log("processRequest");
    console.log(context);

    if (context.content instanceof Array) {
        console.log("content is a array");
        type = context.content[i].type;
    } else {
        console.log("content is not an array");
        type = context.content.type;
    }

    switch (type) {
        case 'menu':
            result.response = getMenuResponse(input, context.content[i].content);
            break;
        case 'input':
            console.log("type input:");
            console.log(context.content[i].content.description);
            result.response = context.content[i].content.description + '\n';
            break;
        case 'wizard':
            console.log("processRequest, type wizard");
            result.response = getWizardResponse(input, context.content[i].content);
            break;
        case 'message':
            result.response = context.content[i].description + '\n';
            result.skip = true;
            break;
        case 'end':
            console.log("end found");
            console.log(context.content[i].ref);
            result = serviceSwitch(context.content[i].ref);
            console.log("result");
            console.log(result);

            if (result.success) {
                var newContext = JSON.parse(JSON.stringify(result.data));
                var newResult = processRequest(input, newContext);
                result.context = JSON.parse(JSON.stringify(result.data));
                result.newContext = true;
                result.response = newResult.response;
            }
            break;
        default:
            break;
    }

    return result;

}

function validateInput(moText, context) {

    var input = moText.toLowerCase();
    var response = { success: true, menuOption: false };
    var i = context.indexPos;
    var type = '';
    var found;

    if (context.content instanceof Array) {
        console.log("content is a array");
        type = context.content[i].type;
    } else {
        console.log("content is not an array");
        type = context.content.type;
    }

    console.log("validating input:" + moText);
    console.log("type:" + type);
    console.log("index:" + i);

    switch (type) {
        case 'menu':
            var menuContent = context.content[i].content;

            console.log("menuContent:");
            console.log(menuContent);
            console.log("input:" + input);

            // if it's only 1 char long and in range of a to last menu option
            found = menuOptions.indexOf(input[0]);
            console.log("found:" + found);
            if (found !== -1 &&
                found <= menuContent.length - 1) {
                response.success = true;
                response.menuOption = true;
                response.firstOption = 'a';
                response.lastOption = menuOptions[menuContent.length - 1];
            } else {
                response.success = false;
                response.response = "invalid menu option";
            }
            break;
        case 'input':
            console.log('input found');
            response.success = true;
            break;
        case 'wizard':
            var wizardContent = context.content[i].content;
            console.log("wizardContent:");
            console.log(wizardContent);

            found = menuOptions.indexOf(input[0]);
            console.log("found:" + found);
            if (input.length === 1 &&
                found !== -1 &&
                found <= wizardContent.length + 1) { // wizards have two extra options a) confirm and b) back
                response.success = true;
                response.firstOption = 'a';
                response.lastOption = menuOptions[wizardContent.length + 1];
            } else {
                response.success = false;
                response.response = "invalid menu option";
            }
            break;
        case 'message':
            console.log("message type");
            response.success = true;
            break;
        default:
            break;

    }

    return response;
}

function processHeader(content) {
    var header = '';

    console.log("inside header content:");
    console.log(content);

    if (typeof content.header !== 'undefined') {
        header = content.header + '\n';
    }
    return header;
}

function processFooter(content) {

    var footerText;

    if (content.type === 'message') {
        footerText = '';
    } else if (typeof content.footer !== 'undefined') {
        footerText = '<' + content.footer + '>';
    } else {
        footerText = '<' + menuFooter + '>';
    }

    return footerText;
}


app.get('/api/getResponse', function(req, res, next) {

    var moText = (typeof req.query.moText !== 'undefined') ? req.query.moText.trim() : 'skip';
    var skip = req.query.skip;
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

    if (typeof skip !== 'undefined') console.log("skip constructor:" + skip.constructor);

    i = req.session.onemContext.indexPos;

    firstChar = moText[0].toLowerCase();

    // check MO request for reserved verbs or service switching
    switch (true) {
        case (skip === 'true'):
            console.log("skip redirect found");
            break;
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
            var menuRef = req.session.onemContext.content[i].menuRef;
            if (typeof menuRef !== 'undefined') {
                var result = serviceSwitch(menuRef);
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
            } else {
                status.success = false;
                status.response = "Send a valid option";
            }
            break;
        case (moText === 'back'):
            if (req.session.onemContext.indexPos === 0) {
                moText = 'menu';
            } else {
                req.session.onemContext.indexPos--;
                i = req.session.onemContext.indexPos;
                console.log("decrementing index, now:" + i);
            }
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

    var body = { response: '' }; // container for processRequest

    if (status.success && status.menuOption) {

        var result = {};

        // step into menu

        i = req.session.onemContext.indexPos;
        result = processMenuContext(moText, req.session.onemContext);
        if (result.success) {
            req.session.onemContext = JSON.parse(JSON.stringify(result.data));
            body = processRequest(moText, req.session.onemContext);
            i = req.session.onemContext.indexPos;
            header = processHeader(req.session.onemContext.content[i]);
            footer = processFooter(req.session.onemContext.content[i]);
        } else {
            body.response = result.response;
        }
        //        req.session.onemContext = processMenuContext(moText, req.session.onemContext);

        console.log("after processmenu, index:" + req.session.onemContext.indexPos + ' i:' + i);

        console.log("content:");
        console.log(req.session.onemContext.content[i]);


    } else if (status.success) {

        if (!firstTime && !serviceSwitched && !verb) {
            req.session.onemContext.indexPos++;
            console.log("incrementing index, now:" + i);
        }

        console.log("before processRequest, not a menu option, i:" + i);

        body = processRequest(moText, req.session.onemContext);

        if (body.newContext) {
            req.session.onemContext = JSON.parse(JSON.stringify(body.context));
        }

        i = req.session.onemContext.indexPos;

        console.log("after processRequest, not a menu option, i:" + i);

        header = processHeader(req.session.onemContext.content[i]);
        footer = processFooter(req.session.onemContext.content[i]);
    } else {
        //
        // this is a failed case, can put customised header/footer in here, but only if context is valid
        //
        // header = processHeader(req.session.onemContext.content[i]);
        body.response = status.response;
        // footer = processFooter(req.session.onemContext.content[i]);
    }

    var finalResponse = header + body.response + footer;

    res.json({
        mtText: finalResponse,
        skip: body.skip
    });


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