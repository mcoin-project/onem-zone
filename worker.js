require('dotenv').load();

var SCWorker = require('socketcluster/scworker');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');
var clients = require('./app_api/common/clients.js');
var common = require('./app_api/common/common.js');
var sms = require('./app_api/common/sms.js');

var user = require('./app_api/controllers/user.js');
var net = require('net');

var debug = require('debug')('onemzone');

var helmet = require('helmet');
var compression = require('compression');

var methodOverride = require('method-override');
var bodyParser = require('body-parser');
var errorHandler = require('errorhandler');
var routesApi = require('./app_api/routes/index.js');

var clients;

class Worker extends SCWorker {
    run() {
        debugger;
        //The message state to be used in receipts:
        // Bring in the data model & connect to db
        require('./app_api/models/db');

        debug('   >> Worker PID:', process.pid);
        var environment = this.options.environment;

        //    debug("environment:" + environment);
        //    debug(process.env);

        //debug("inside worker, authKey: " + this.options.authKey);

        var self = this;

        if (self.isLeader) {
            sms.setWorker(self.scServer);
            clients = require('../common/clients.js');
        }

        var app = express();

        var public_folder = environment == 'production' ? 'public' : 'app_client';

        debug("public_folder:" + public_folder);

        var httpServer = this.httpServer;
        var scServer = this.scServer;

        if (environment === 'dev') {
            // Log every HTTP request. See https://github.com/expressjs/morgan for other
            // available formats.
            app.use(morgan('dev'));
            app.use(errorHandler());
        }
        app.use(helmet.noCache());

        // compress all responses
        app.use(compression());
        app.use(methodOverride());
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: true }));

        // Force HTTPS on Heroku
        // if (app.get('env') === 'production') {
        if (process.env.HTTPS === 'ON') {
            app.use(function (req, res, next) {
                var protocol = req.get('x-forwarded-proto');
                protocol == 'https' ? next() : res.redirect('https://' + req.hostname + req.url);
            });
        }

        app.use(serveStatic(path.resolve(__dirname, public_folder)));

        // Add GET /health-check express route
        healthChecker.attach(this, app);

        // Use the API routes when path starts with /api
        app.use('/api', routesApi);

        app.get('/', function (req, res, next) {
            res.sendFile('/' + public_folder + '/index.html', { root: __dirname });
        });

        app.get('*', function (req, res) {
            res.sendFile('/' + public_folder + '/index.html', { root: __dirname });
        });

        app.get('/*', function (req, res, next) {
            debug("caught default route");
            // Just send the index.html for other files to support HTML5Mode
            res.sendFile('/' + public_folder + '/index.html', { root: __dirname });
        });

        httpServer.on('request', app);

        debug("isLeader:" + self.isLeader);
        if (self.isLeader && process.env.TEST !== 'on') {
            sms.initialize();
        }

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
                        if (self.isLeader) {
                            debug("setting up watch on : " + req.channel);
                            scServer.exchange.subscribe(req.channel);
                            scServer.exchange.watch(req.channel, function (d) {
                                debug("received message on watched channel:");
                                debug(d);
                                var moRecord = {
                                    mtText: '' // the pending sms text - built up if more-messages-to-send
                                };
                                clients.clients[req.channel] = {};
                                clients.clients[req.channel].moRecord = moRecord;
                                if (d.type == "mo") {
                                    sms.sendSMS(req.channel, common.shortNumber, d.value);
                                }
                            });
                        }
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
                if (!user.msisdn) {
                    throw "msisdn is missing";
                }
                if (!user) {
                    throw "user not found";
                }
                return next();
            }).catch(function (error) {
                debug(error);
                next(new Error(error), 4500);
            });
        });

        /*
          In here we handle our incoming realtime connections and listen for events.
        */
        scServer.on('connection', function (socket) {

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

            if (authToken) {
                // need to check if token hasn't expired
                user.getUser(authToken.sub).then(function (user) {
                    debug("user found, returning next");

                    var msisdn = user.msisdn;
                    if (!msisdn) {
                        throw "msisdn is missing";
                    }
                    if (!user) {
                        throw "user not found!";
                    }
                    debug("socket on: " + msisdn);

                    socket.on(msisdn, function (data, res) {
                        console.log("message received from: " + msisdn);
                        console.log(data);
                        res(null, 'OK');
                        scServer.exchange.publish(msisdn, { data: data });
                    });

                }).catch(function (error) {
                    debug(error);
                });
            } else {
                console.log("no auth token");
            }


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

