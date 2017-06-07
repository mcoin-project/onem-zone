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
var basicAuth = require('basic-auth');

var app = express();

// Bring in the routes for the API (delete the default routes)
var routesApi = require('./app_api/routes/index.js');

// Bring in the data model & connect to db
// require('./app_api/models/db');

// The http server will listen to an appropriate port, or default to
// port 5000.
var theport = process.env.PORT || 5000;
var username = process.env.USERNAME;
var password = process.env.PASSWORD;

var smppSession; // the smpp session context saved globally.
var resArray = [];

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === username && user.pass === password) {
    return next();
  } else {
    return unauthorized(res);
  };
};


app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

// JsSIP is not designed to use "express" library. To be loaded we need its path:
app.use(express.static(path.join(__dirname, 'node_modules/jssip/dist')));

app.use(session({
    secret: 'aut0test',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 360000 } // 24 hours
}));

app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// Use the API routes when path starts with /api
app.use('/api', routesApi);

var smppServer = smpp.createServer(function(session) {

    // var alreadySent = false;
    var mtText = '';
    var i, resObj;

    smppSession = session; // save the session globally

    session.on('bind_transceiver', function(pdu) {
        console.log('Bind request received, system_id:' + pdu.system_id + ' password:' + pdu.password);
        // we pause the session to prevent further incoming pdu events,
        // untill we authorize the session with some async operation.
        session.pause();
        //     checkAsyncUserPass(pdu.system_id, pdu.password, function(err) {
        //         if (err) {
        if (!(pdu.system_id == "autotest" && pdu.password == 'password')) {
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
        //  var msgid = getMsgId(); // generate a message_id for this message.
        console.log("submit_sm received, sequence_number:" + pdu.sequence_number + " isResponse:" + pdu.isResponse());

        // smppSession.send(pdu.response({
        //     sequence_number: pdu.sequence_number
        //          message_id: msgid
        //  }));

        smppSession.send(pdu.response());

        if (pdu.short_message.length === 0) {
            console.log("** payload being used **");
            mtText = pdu.message_payload;
        } else {
            mtText = mtText + pdu.short_message.message;
        }
        // console.log("mtText:" + mtText);

        console.log("more messages:" + pdu.more_messages_to_send);

        // find the matching res object against the msisdn


        for (i = 0; i < resArray.length; i++) {
            if (resArray[i].msisdn === pdu.destination_addr) {
                resObj = resArray[i].res;
                break;
            }
        }
        // remove the matching record so we dont reply to it again
        if (i < resArray.length) resArray.splice(i, 1);

        if (resObj && (pdu.more_messages_to_send === 0 ||
                typeof pdu.more_messages_to_send === 'undefined')) {
          //  alreadySent = true;
            resObj.json({
                //       mtText: pdu.short_message.message,
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

    //As we need UCS-2, a conversion is needed from ASCII to UCS-2:
    var buffer = new Buffer(2 * text.length);
    //This is for writing the UTF-16-BE in the message:
    for (var i=0; i<text.length; i++) {
        buffer.writeUInt16BE(text.charCodeAt(i),2*i);
    };
    ////This is for writing the text in the message as it is (just in case we need it):
    //buffer.write(text,"ascii");

    smppSession.deliver_sm({
        source_addr: from,
        source_addr_ton: 2,
        source_addr_npi: 1,
        destination_addr: to,
        destination_addr_ton: 1,
        destination_addr_npi: 1,
        data_coding: 8,
        //short_message: text
        short_message: buffer
    }, function(pdu) {
        //    console.log('sms pdu status', lookupPDUStatusKey(pdu.command_status));
        if (pdu.command_status === 0) {
            // Message successfully sent
            console.log("message sent:");
        }
    });
}

function getMsgId(min, max) {
    return Math.floor(Math.random() * 65);
}

app.get('/api/getResponse', function(req, res, next) {

    var msisdn = '447725419720' || req.query.msisdn.trim();
    var moText = (typeof req.query.moText !== 'undefined') ? req.query.moText.trim() : 'skip';
    var skip = req.query.skip;

    var body = { response: '', skip: false }; // container for processRequest


    if (moText.length === 0) return res.json({ mtText: undefined });

    console.log("sending SMS");
    sendSMS(msisdn, '444100', moText);

    resArray.push({
        msisdn: msisdn,
        res: res
    });

});

app.get('/', auth, function(req, res, next) {
    res.sendFile('/public/views/index.html', { root: __dirname });
});

app.get('*', auth, function(req, res) {
    res.sendFile('/public/views/index.html', { root: __dirname });
});

app.get('/*', auth, function(req, res, next) {
    console.log("caught default route");
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('/public/views/index.html', { root: __dirname });
});

// error handling middleware should be loaded after the loading the routes
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

smppServer.listen(2775);

var server = http.createServer(app);
//server.listen(app.get('port'), function() {
//    console.log('Express server listening on port ' + app.get('port'));
//});
server.listen(5000);

module.exports = app;
