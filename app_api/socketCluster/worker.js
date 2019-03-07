var SCWorker = require('socketcluster/scworker');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');
var debug = require('debug')('onemzone');
var clients = require('../common/clients.js');
var common = require('../common/common.js');

var user = require('../controllers/user.js');
var net = require('net');

const smppPort = process.env.SMPP_PORT || 2775;

class Worker extends SCWorker {
    run() {
        debugger;
        //The message state to be used in receipts:
        // Bring in the data model & connect to db
        require('../models/db');

        debug('   >> Worker PID:', process.pid);
        var environment = this.options.environment;

    //    debug("environment:" + environment);
    //    debug(process.env);

        //debug("inside worker, authKey: " + this.options.authKey);

        var self = this;

        var app = express();

        var httpServer = this.httpServer;
        var scServer = this.scServer;

        if (environment === 'dev') {
            // Log every HTTP request. See https://github.com/expressjs/morgan for other
            // available formats.
            app.use(morgan('dev'));
        }
        app.use(serveStatic(path.resolve(__dirname, 'public')));

        // Add GET /health-check express route
        healthChecker.attach(this, app);

        httpServer.on('request', app);

        // For SocketCluster handshakes
        // scServer.addMiddleware(scServer.MIDDLEWARE_HANDSHAKE_SC, function (req, next) {
        //     var authToken = req.socket.authToken;
        //     debug("authToken");
        //     debug(authToken);

        //     if (!authToken || !authToken.sub) {
        //         return next(new Error("No token"), 4500);
        //     }
        //     user.getUser(authToken.sub).then(function (user) {
        //         //req.user = user._id;
        //         next();
        //     }).catch(function (error) {
        //         debug(error);
        //         debug("user not found!!");
        //         next(new Error(error), 4500);
        //     });

        // });

        scServer.addMiddleware(scServer.MIDDLEWARE_SUBSCRIBE, function (req, next) {
            var authToken = req.socket.authToken;

            if (req.authTokenExpiredError) {
                next(req.authTokenExpiredError); // Fail with a default auth token expiry error
            } else if (!authToken || !authToken.sub) {
                next(new Error("No token"), 4500);
            } else {

                debug("SUBSCRIBE - worker, authToken");
                debug("querying:" + authToken.sub);

                user.getUser(authToken.sub).then(function (user) {
                    debug("user found, returning next");
                    req.user = user._id;
                    req.msisdn = user.msisdn;
                    if (req.channel == req.msisdn) {
                        next();
                    } else {
                        next(new Error("Unauthorized channel"), 4500);
                    }
                }).catch(function (error) {
                    debug(error);
                    debug("user not found!!");
                    next(new Error(error), 4500);
                });
            }
        });

        scServer.addMiddleware(scServer.MIDDLEWARE_EMIT, function (req, next) {

            // debug("req.socket:");
            // debug(req.socket);

            var authToken = req.socket.authToken;
            debug("EMIT - worker, authToken");
            debug(authToken);

            if (!authToken || !authToken.sub) {
                return next(new Error("No token"), 4500);
            }
            debug("querying:" + authToken.sub);

            user.getUser(authToken.sub).then(function (user) {
                debug("user found, returning next");
                req.user = user._id;
                req.msisdn = user.msisdn;
                return next();
            }).catch(function (error) {
                debug(error);
                debug("user not found!!");
                next(new Error(error), 4500);
            });
        });

        debug("isLeader:"+self.isLeader);
        if (self.isLeader) {

           require('../common/sms.js');
            var textChunk = '';
            // var server = net.createServer(function(socket) {
            //     socket.write('Echo server\r\n');
            //     socket.on('data', function(data){
            //         console.log(data);
            //         textChunk = data.toString('utf8');
            //         console.log(textChunk);
            //         socket.write(textChunk);
            //     });
            //     socket.on('error', function(err) {
            //         console.log(err);
            //     });
                
            //     socket.on('close', function() {
            //         console.log('Connection closed');
            //     });

            // });

            // server.listen(smppPort, '127.0.0.1');

            var smsMochannel = scServer.exchange.subscribe('smsMoChannel');
            debug("subscribed to sms mo channel");
        }

        /*
          In here we handle our incoming realtime connections and listen for events.
        */
        scServer.on('connection', function (socket) {

            var msisdn;
            // Some sample logic to show how to handle client events,
            // replace this with your own logic

            //   socket.on('sampleClientEvent', function (data) {
            //     count++;
            //     debug('Handled sampleClientEvent', data);
            //     scServer.exchange.publish('sample', count);
            //   });

            //   var interval = setInterval(function () {
            //     socket.emit('random', {
            //       number: Math.floor(Math.random() * 5)
            //     });
            //   }, 1000);

            debug("Connection received: " + socket.id);
            //sms.clients.push(socket);    

            var authToken = socket.getAuthToken();

            // need to check if token hasn't expired
            user.getUser(authToken.sub).then(function (user) {
                debug("user found, returning next");
                msisdn = user.msisdn;
            }).catch(function (error) {
                debug(error);
                debug("user not found!!");
            });

            // check for existing connection from msisdn already logged in (on another device) and kick them off
            if (msisdn) {
                debug("found existing user");
                if (typeof clients.clients[msisdn] !== 'undefined' && clients.clients[msisdn].moRecord.socket) {
                    try {
                        clients.clients[msisdn].moRecord.socket.emit('LOGOUT'); //Send the whole message at once to the web exports.clients.
                    } catch (error) {
                        debug(error);
                        debug("could not kill client");
                    }
                }
                clients.clients[msisdn] = {};
                var moRecord = {
                    socket: socket,
                    mtText: '',
                };
                clients.clients[msisdn].moRecord = moRecord;
                // deliver any saved messages for this user
                message.deliverPending(socket);
            }

            socket.on('message', function (data) {

                var moText, incomingObj;

                if (!socket.getAuthToken()) return;

                try {
                    incomingObj = JSON.parse(data);
                } catch (err) {
                    return;
                }
                debug("message event:" + incomingObj.event);
                if (incomingObj.event !== "#publish") return;

                moText = incomingObj.data.data;
                
                //var authToken = socket.getAuthToken();

                //ack();

                debug('moText: ');
                debug(moText);

                var moRecord = {
                    socket: socket, // presence of this indicates that client is connected
                    mtText: '', // the pending sms text - built up if more-messages-to-send
                };
                clients.clients[msisdn] = {};
                clients.clients[msisdn].moRecord = moRecord;

                debug("sending SMS to Short Number " + common.shortNumber + " from: " + msisdn);

                // this should be broadcast to the sms channel that the lead worker is listening on
                var data = {
                    msisdn: msisdn,
                    shortNumber: common.shortNumber,
                    moText: moText
                }

            });

            socket.on('disconnect', function () {
                debug('Client gone (id=' + socket.id + ').');

                var msisdn, authToken = socket.getAuthToken();

                user.getUser(authToken.sub).then(function (user) {
                    debug("user found, returning next");
                    msisdn = user.msisdn;
                }).catch(function (error) {
                    debug(error);
                    debug("user not found!!");
                });

                if (msisdn) delete clients.clients[msisdn].moRecord.socket;
            });
        });

    }
}

new Worker();

