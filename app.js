require('dotenv').load();

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
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
var sms = require('./app_api/common/sms.js')
const shortNumber = process.env.SHORT_NUMBER || "444100";

// Bring in the routes for the API (delete the default routes)
var routesApi = require('./app_api/routes/index.js');

// The http server will listen to an appropriate port, or default to
// port 5000.
var theport = process.env.PORT || 5000;
var username = process.env.USERNAME; // used for web basic auth
var password = process.env.PASSWORD; // used for web basic auth

var sipProxy = process.env.SIP_PROXY || "zoiper.dhq.onem";
var wsProtocol = process.env.WS_PROTOCOL || "ws";

//The message state to be used in receipts:

app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules'))); //TODO: Adapt this root for JsSIP also so it won't be necessary to use next one:
// JsSIP is not designed to use "express" library. To be loaded we need its path:
//app.use(express.static(path.join(__dirname, 'node_modules/jssip/dist')));

var express_middleware = session({
    secret: 'aut0test',
    resave: true,
    store: new FileStore,
    saveUninitialized: true,
    cookie: { maxAge: 365 * 4 * 24 * 60 * 60 * 1000 } // 4 years
});

app.use(express_middleware);

//Use of Express-Session as Middleware    
io.use(function(socket, next) {
    express_middleware(socket.handshake, {}, next);
});

app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Use the API routes when path starts with /api
app.use('/api', routesApi);

io.on('connection', function(socket) {

    console.log("Connection received!");
    sms.clients.push(socket);

    socket.emit(socket.handshake.session);

    if (!socket.handshake.session.onemContext) { //must be first time, or expired
        var msisdn = moment().format('YYMMDDHHmmss');
        console.log("msisdn:" + msisdn);
        socket.handshake.session.onemContext = { msisdn: msisdn };
        socket.handshake.session.save();
    }

    socket.on('MO SMS', function(moText) {
        console.log('moText: ');
        console.log(moText);

        var moRecord = {
            msisdn: socket.handshake.session.onemContext.msisdn,
            socket: socket,
            mtText: '',
            messageWaiting: false
        };

        var i = sms.clients.indexOf(socket);
        sms.clients[i].moRecord = moRecord;

        console.log("sending SMS to Short Number " + shortNumber);
        // sendSMS(socket.handshake.session.onemContext.msisdn, '444100', moText);
        sms.sendSMS(socket.handshake.session.onemContext.msisdn, shortNumber, moText);

    });

    socket.on('disconnect', function() {
        console.info('Client gone (id=' + socket.id + ').');
        var index = sms.clients.indexOf(socket);
        sms.clients.splice(index, 1);
    });

});

app.get('/api/start', function(req, res, next) {

    // if first time (no session) then generate a virtual MSISDN using current timestamp, which is saved in session cookie
    if (!req.session.onemContext) { //must be first time, or expired
        var msisdn = moment().format('YYMMDDHHmmss');
        console.log("msisdn:" + msisdn);

        req.session.onemContext = { msisdn: msisdn };
        //Should I save it here, also??????
    }

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
        msisdn: req.session.onemContext.msisdn,
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