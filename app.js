var http = require('http');
var express = require('express');
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
var smpp = require('smpp');
var app = express();
var FileStore = require('session-file-store')(session);


require('dotenv').load();

var routesApi = require('./app_api/routes/index.js');

var theport = process.env.PORT || 5000;
var username = process.env.USERNAME;  // used for web basic auth
var password = process.env.PASSWORD;  // used for web basic auth
var smppSystemId = process.env.SMPP_SYSTEMID || "autotest";
var smppPassword = process.env.SMPP_PASSWORD || "password";

var smppSession;
var resArray = [];

app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'aut0test',
    resave: false,
    store: new FileStore,
    saveUninitialized: true,
    cookie: { maxAge: 365 * 2 * 24 * 60 * 60 * 1000 } // 2 years
}));

app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


app.use('/api', routesApi);

var smppServer = smpp.createServer(function(session) {

    var mtText = '';
    var i, resObj;

    smppSession = session;

    session.on('bind_transceiver', function(pdu) {
        console.log('Bind request received, system_id:' + pdu.system_id + ' password:' + pdu.password);
        session.pause();
        if (!(pdu.system_id == smppSystemId && pdu.password == smppPassword)) {
            session.send(pdu.response({
                command_status: smpp.ESME_RBINDFAIL
            }));
            console.log('Error binding');
            session.close();
            return;
        }
        console.log('Successfully bound');
        session.send(pdu.response());
        session.resume();
    });

    session.on('enquire_link', function(pdu) {
        console.log('enquire_link received');
        session.send(pdu.response());
    });

    session.on('unbind', function(pdu) {
        console.log('unbind received, closing session');
        session.send(pdu.response());
        session.close();
    });

    smppSession.on('submit_sm', function(pdu) {
        console.log("submit_sm received, sequence_number:" + pdu.sequence_number + " isResponse:" + pdu.isResponse());

        smppSession.send(pdu.response());

        if (pdu.short_message.length === 0) {
            console.log("** payload being used **");
            mtText = pdu.message_payload;
        } else {
            mtText = mtText + pdu.short_message.message;
        }

        console.log("more messages:" + pdu.more_messages_to_send);

        for (i = 0; i < resArray.length; i++) {
            if (resArray[i].msisdn === pdu.destination_addr) {
                resObj = resArray[i].res;
                break;
            }
        }
        if (i < resArray.length) resArray.splice(i, 1);

        if (resObj && (pdu.more_messages_to_send === 0 ||
                typeof pdu.more_messages_to_send === 'undefined')) {
            resObj.json({
                mtText: mtText,
                skip: false
            });
            mtText = '';
        }
    });

    smppSession.on('deliver_sm', function(pdu) {
        console.log("deliver_sm received" + pdu);
        if (pdu.esm_class == 4) {
            var shortMessage = pdu.short_message;
            console.log('Received DR: %s', shortMessage.trim());
            smppSession.send(pdu.response());
        }
    });

});

function sendSMS(from, to, text) {

    var buffer = new Buffer(2 * text.length);
    for (var i=0; i<text.length; i++) {
        buffer.writeUInt16BE(text.charCodeAt(i),2*i);
    };

    smppSession.deliver_sm({
        source_addr: from,
        source_addr_ton: 1,
        source_addr_npi: 0,
        destination_addr: to,
        destination_addr_ton: 1,
        destination_addr_npi: 0,
        data_coding: 8,
        short_message: buffer
    }, function(pdu) {
        if (pdu.command_status === 0) {
            console.log("message sent:");
        }
    });
}

function getMsgId(min, max) {
    return Math.floor(Math.random() * 65);
}

app.get('/api/getResponse', function(req, res, next) {

    var moText = (typeof req.query.moText !== 'undefined') ? req.query.moText.trim() : 'skip';
    var skip = req.query.skip;
    var body = { response: '', skip: false };

    if (!req.session.onemContext) { // must be first time, or expired
        var msisdn = moment().format('YYMMDDHHMMSS');
        console.log("msisdn:" + msisdn);

        req.session.onemContext = { msisdn: msisdn };
    }

    if (moText.length === 0) return res.json({ mtText: undefined });

    console.log("sending SMS");
    sendSMS(req.session.onemContext.msisdn, '444100', moText);

    resArray.push({
        msisdn: req.session.onemContext.msisdn,
        res: res
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
    res.sendFile('/public/views/index.html', { root: __dirname });
});

if ('development' == app.get('env')) {
    app.use(errorHandler());
}

smppServer.listen(2775);

var server = http.createServer(app);
server.listen(5000);

module.exports = app;

