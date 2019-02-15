const debug = require('debug')('onemzone');

var sio = require('socket.io');

var common = require('../common/common.js');
var user = require('../controllers/user.js');
var message = require('../controllers/message.js');

var sms = require('../common/sms.js');
var clients = require('../common/clients.js');

var io = null;

var index = 0;
var testMessages = [
    "#ACCOUNT\n  1 Afrikaans\n  2 Akan\n  3 Albanian\n  4 Amharic\n  5 Arabic\n  6 Armenian\n  7 Assamese\n  8 Azerbaijani\n  9 Bambara\n 10 Basque\n 11 Belarusian\n 12 Bengali\n 13 Bosnian\n 14 Breton\n 15 Bulgarian\n 16 Burmese\n 17 Catalan\n 18 Chechen\n 19 Chinese\n..1/7\n--MORE/BACK"
]

exports.io = function () {
    return io;
};

exports.initialize = function (server) {

    io = sio(server);

    // io.use(function(socket, next) {
    //     express_middleware(socket.handshake, {}, next);
    // });

    io.use(function (socket, next) {
        if (socket.handshake.query && socket.handshake.query.token) {
            debug("query.token:")
            debug(socket.handshake.query.token);
            var payload = common.decodeJWT(socket.handshake.query.token);
            if (!payload) {
                debug("invalid jwt");
                next(new Error('Authentication error'));
            }
            socket.jwtPayload = payload;
            debug("socket: querying user: " + payload.sub);
            user.getUser(payload.sub).then(function (u) {
                socket.msisdn = u.msisdn;
                next();
            }).catch(function (error) {
                debug(error);
                debug("user not found!!");
                return next(new Error('User not found'));
            });
            //debug("payload");
            //debug(payload);
        } else {
            debug("missing jwt");
            next(new Error('Authentication error'));
        }
    }).on('connection', function (socket) {

        debug("Connection received: " + socket.id);
        //sms.clients.push(socket);    

        debug(socket.msisdn);
        debug(clients.clients[socket.msisdn]);

        // check for existing connection from msisdn already logged in (on another device) and kick them off
        if (socket.msisdn) {
            debug("found existing user");
            if (typeof clients.clients[socket.msisdn] !== 'undefined' && clients.clients[socket.msisdn].moRecord.socket) {
                try {
                    clients.clients[socket.msisdn].moRecord.socket.emit('LOGOUT'); //Send the whole message at once to the web exports.clients.
                } catch (error) {
                    debug(error);
                    debug("could not kill client");
                }
            }
            clients.clients[socket.msisdn] = {};
            var moRecord = {
                socket: socket,
                mtText: '',
            };
            clients.clients[socket.msisdn].moRecord = moRecord;
            // deliver any saved messages for this user
            message.deliverPending(socket);
        }

        socket.on('MO SMS', function (moText) {
            debug('moText: ');
            debug(moText);

            // todo santizie the moText

            debug("socket.id");
            debug(socket.id);

            //debug("socket");
            //debug(socket);

            if (socket.msisdn) {
                var moRecord = {
                    socket: socket, // presence of this indicates that client is connected
                    mtText: '', // the pending sms text - built up if more-messages-to-send
                };
                clients.clients[socket.msisdn] = {};
                clients.clients[socket.msisdn].moRecord = moRecord;

                debug("sending SMS to Short Number " + common.shortNumber + " from: " + socket.msisdn);
                sms.sendSMS(socket.msisdn, common.shortNumber, moText);
            } else {
                debug("can't locate msisdn for user");
            }

        });

        socket.on('API MO SMS', function (moText) {
            debug('moText: ');
            debug(moText);

            // todo santizie the moText

            debug("socket.id");
            debug(socket.id);

            //debug("socket");
            //debug(socket);

            if (socket.msisdn) {
                var moRecord = {
                    socket: socket, // presence of this indicates that client is connected
                    mtText: '', // the pending sms text - built up if more-messages-to-send
                    api: true
                };
                clients.clients[socket.msisdn] = {};
                clients.clients[socket.msisdn].moRecord = moRecord;

                debug("sending SMS to Short Number " + common.shortNumber + " from: " + socket.msisdn);
                sms.sendSMS(socket.msisdn, common.shortNumber, moText);

                if (process.env.TEST == 'on') {

                    var timer = setTimeout(
                        function () {
                            if (index == testMessages.length) index = 0;
                            if (testMessages[index]) socket.emit('API MT SMS', { mtText: testMessages[index] });
                            index++;
                        }, 3000
                    );
                }

            } else {
                debug("can't locate msisdn for user");
            }

        });

        socket.on('disconnect', function () {
            debug('Client gone (id=' + socket.id + ').');
            if (socket.msisdn) delete clients.clients[socket.msisdn].moRecord.socket;
            delete socket.msisdn;
        });

    });
}