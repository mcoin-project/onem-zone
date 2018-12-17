require('dotenv').load();

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var logger = require('morgan');
var path = require('path');
var favicon = require('serve-favicon');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var request = require('request');
var fs = require('fs');
var moment = require('moment');

var _ = require('underscore-node');
var FileStore = require('session-file-store')(session);
var common = require('./app_api/common/common.js');

// Bring in the routes for the API (delete the default routes)
var routesApi = require('./app_api/routes/index.js');
var io = require('./app_api/common/io.js');


// The http server will listen to an appropriate port, or default to
// port 5000.
var theport = process.env.PORT || 5000;

var sipProxy = process.env.SIP_PROXY || "zoiper.dhq.onem";
var wsProtocol = process.env.WS_PROTOCOL || "ws";

//The message state to be used in receipts:
// Bring in the data model & connect to db
require('./app_api/models/db');

app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules'))); //TODO: Adapt this root for JsSIP also so it won't be necessary to use next one:
// JsSIP is not designed to use "express" library. To be loaded we need its path:
//app.use(express.static(path.join(__dirname, 'node_modules/jssip/dist')));

// var express_middleware = session({
//     secret: 'aut0test',
//     resave: true,
//     store: new FileStore,
//     saveUninitialized: true,
//     cookie: { maxAge: 365 * 4 * 24 * 60 * 60 * 1000 } // 4 years
// });

//app.use(express_middleware);

io.initialize(server);

app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Use the API routes when path starts with /api
app.use('/api', routesApi);

/*
 |--------------------------------------------------------------------------
 | Login Required Middleware
 |--------------------------------------------------------------------------
 */
function ensureAuthenticated(req, res, next) {
    if (!req.header('Authorization')) {
      return res.status(401).send({ message: 'Unauthorized request' });
    }
    var token = req.header('Authorization').split(' ')[1];
  
    var payload = common.decodeJWT(token);
    if (!payload) {
        return res.status(401).send({ message: 'Unauthorized Request' });
    }
    common.getUser(payload.sub).then(function(user) {
        req.msisdn = user.msisdn;
        req.user = payload.sub;
        next();
    }).catch(function(error) {
        console.log(error);
        console.log("user not found!!");
        return next(new Error('User not found'));
    });
  }

app.get('/api/start', ensureAuthenticated, function(req, res, next) {


    var httpProtocol = req.get('Referer').split(":")[0];
    console.log(httpProtocol);
    console.log(wsProtocol);

    if (httpProtocol == 'https') {
        // the used protocol is HTTPS
        console.log('The HTTPS protocol has been used; "wss" will be used for WebRTC');
        wsProtocol = "wss";
    } else {
        console.log('It appears that HTTP protocol has been used; environment provided protocol or "ws" will be used for WebRTC');
        wsProtocol = process.env.WS_PROTOCOL || "ws";
    };
    console.log(wsProtocol);

    res.json({
        msisdn: req.msisdn,
        sipproxy: sipProxy,
        wsprotocol: wsProtocol
    });

});

// app.get('/', function(req, res, next) {
//     res.sendFile('/public/views/index.html', { root: __dirname });
// });

// app.get('*', function(req, res) {
//     res.sendFile('/public/views/index.html', { root: __dirname });
// });

app.get('/*', function(req, res, next) {
    console.log("caught default route");
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('/public/views/index.html', { root: __dirname });
});

// error handling middleware should be loaded after the loading the routes
if ('development' == app.get('env')) {
    app.use(errorHandler());
}
server.listen(theport);

module.exports = app;