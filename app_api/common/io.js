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
//    "DID YOU MEAN?\nA #account\nB #aljazeera\nC #contacts\nD #france24\nE #market\nF #msg\nG #onem\nH #post\nI #reuters\nJ #subscribe\nK #wiki\nL #xgroup\nM #unsubscribe\n--Reply A-M",
    "DID YOU MEAN?\n   1 #account\n    2 #aljazeera\n    3 #arabic\n    4 #call\n    5 #contacts\n    6 #convert\n    7 #crossword\n    8 #duas\n    9 #dw\n   10 #exchange\n   11 #finance\n   12 #france24\n   13 #hangman\n   14 #jokes\n   15 #market\n   ..1/3\n   --MORE",
    "#MARKET SELL\nA Sell Something\nB Active listings(1)\nC De-listed(0)\nD Orders to approve(0)\nE Orders to dispatch(0)\nF My profile\n--Reply A-F or BUY or search words",
//    "#FRANCE24 EUROPE\nTitle: US urges Europe to quit Iran deal, stop busting sanctions\nStory: The US lashed out at some of its closest allies Thursday, accusing Britain, France and Germany of trying to bust US sanctions against Iran and calling on\n..01/29\n--MORE/BACK",
//    "#MARKET NEW ITEM STEP(1/3)\n    Listing expires in 7 days\n    Describe your item (100 chars).\n    Example:\n    iPhone 6 64GB Silver, unlocked\n    --Reply with description or CANCEL",
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
                        }, 1000
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