var sio = require('socket.io');

var common = require('../common/common.js');
var user = require('../controllers/user.js');
var sms = require('../common/sms.js');
var clients = require('../common/clients.js');

var io = null;

exports.io = function () {
  return io;
};

exports.initialize = function(server) {

    io = sio(server);
    
    // io.use(function(socket, next) {
    //     express_middleware(socket.handshake, {}, next);
    // });

    io.use(function(socket, next){
        if (socket.handshake.query && socket.handshake.query.token){
            console.log("query.token:")
            console.log(socket.handshake.query.token);
            var payload = common.decodeJWT(socket.handshake.query.token);
            if (!payload) {
                console.log("invalid jwt");
                next(new Error('Authentication error'));       
            }
            socket.jwtPayload = payload;
            console.log("socket: querying user: " + payload.sub);
            user.getUser(payload.sub).then(function(u) {
                socket.msisdn = u.msisdn;
                next();
            }).catch(function(error) {
                console.log(error);
                console.log("user not found!!");
                return next(new Error('User not found'));
            });
            //console.log("payload");
            //console.log(payload);
        } else {
            console.log("missing jwt");
            next(new Error('Authentication error'));
        }    
    }).on('connection', function(socket) {

        console.log("Connection received: " + socket.id);
        //sms.clients.push(socket);    

        console.log(socket.msisdn);
        console.log(clients.clients[socket.msisdn]);

        // check for existing connection from msisdn already logged in (on another device) and kick them off
        if (socket.msisdn) {
            console.log("found existing user");
            if (typeof clients.clients[socket.msisdn] !== 'undefined' && clients.clients[socket.msisdn].moRecord.socket) {
                try {
                    clients.clients[socket.msisdn].moRecord.socket.emit('LOGOUT'); //Send the whole message at once to the web exports.clients.
                } catch (error) {
                    console.log(error);
                    console.log("could not kill client");
                }
            }
            clients.clients[socket.msisdn] = {};
            var moRecord = {
                socket: socket,
                mtText: '',
            };
            clients.clients[socket.msisdn].moRecord = moRecord;
        }        

        socket.on('MO SMS', function(moText) {
            console.log('moText: ');
            console.log(moText);

            // todo santizie the moText

            console.log("socket.id");
            console.log(socket.id);

            //console.log("socket");
            //console.log(socket);

            //socket.to(socket.handshake.session).emit('MT SMS', { mtText: 'test response'});
            //io.to(socket.id).emit('MT SMS', { mtText: 'test response'});
            //io.of('/').to(socket.id).emit('MT SMS', { mtText: 'test response'});
            //socket.emit('MT SMS', { mtText: 'test response'});


            //var i = sms.clients.indexOf(socket);
            //sms.clients[i].moRecord = moRecord;

            if (socket.msisdn) {
                var moRecord = {
                    socket: socket, // presence of this indicates that client is connected
                    mtText: '', // the pending sms text - built up if more-messages-to-send
                };
                clients.clients[socket.msisdn] = {};
                clients.clients[socket.msisdn].moRecord = moRecord;
                
                console.log("sending SMS to Short Number " + common.shortNumber + " from: " + socket.msisdn);
                // sendSMS(socket.handshake.session.onemContext.msisdn, '444100', moText);
                sms.sendSMS(socket.msisdn, common.shortNumber, moText);
            } else {
                console.log("can't locate msisdn for user");
            }

        });

        socket.on('disconnect', function() {
            console.log('Client gone (id=' + socket.id + ').');
            if (socket.msisdn) delete clients.clients[socket.msisdn].moRecord.socket;
            delete socket.msisdn;
        });

    });
}