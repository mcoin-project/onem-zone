const debug = require('debug')('onemzone');

var sio = require('socket.io');

var common = require('../common/common.js');
var user = require('../controllers/user.js');
var message = require('../controllers/message.js');

var sms = require('../common/sms.js');
var nautilus = require('../common/nautilus.js');

var clients = require('../common/clients.js');
var dbMethods = require('../dbMethods/service');

var io = null;

var index = 0;
var testMessages = [
    "DID YOU MEAN?\n1 #account\n2 #aljazeera\n3 #arabic\n4 #call\n5 #contacts\n6 #convert\n7 #crossword\n8 #duas\n9 #dw\n10 #exchange\n11 #finance\n12 #france24\n13 #hangman\n14 #jokes\n15 #market\n16 #mcat\n17 #mine\n18 #moderate\n19 #msg\n20 #news\n21 #onem\n22 #points\n23 #poll\n24 #post\n25 #quotes\n26 #quran\n27 #radio\n28 #todo\n..1/2\n--MORE",
    "29 #rewards\n30 #salah\n31 #scores\n32 #stock\n33 #stories\n34 #subscribe\n35 #time\n36 #translate\n37 #viacom\n38 #wallet\n39 #weather\n40 #wiki\n41 #words\n42 #xgroup\n43 #unsubscribe\n..2/2\n--Reply 1-43",
    "DID YOU MEAN?\nA #account\nB #aljazeera\nC #contacts\nD #france24\nE #market\nF #msg\nG #onem\nH #post\nI #reuters\nJ #subscribe\nK #wiki\nL #xgroup\nM #unsubscribe\n--Reply A-M",
    "DID YOU MEAN?\n   1 #account\n    2 #aljazeera\n    3 #arabic\n    4 #call\n    5 #contacts\n    6 #convert\n    7 #crossword\n    8 #duas\n    9 #dw\n   10 #exchange\n   11 #finance\n   12 #france24\n   13 #hangman\n   14 #jokes\n   15 #market\n   ..1/3\n   --MORE",
    "#MARKET SELL\nA Sell Something\nB Active listings(1)\nC De-listed(0)\nD Orders to approve(0)\nE Orders to dispatch(0)\nF My profile\n--Reply A-F or BUY or search words",
    "#FRANCE24 EUROPE\nTitle: US urges Europe to quit Iran deal, stop busting sanctions\nStory: The US lashed out at some of its closest allies Thursday, accusing Britain, France and Germany of trying to bust US sanctions against Iran and calling on\n..01/29\n--MORE/BACK",
    "#MARKET\nAdlai is a delicious grain that is high in fiber. https://tinyurl.com/y6d587y9\n7844.32 MCN / 300 GBP\nYour balance 0.0 MCN\n--Reply BACK",
    "#MARKET NEW ITEM STEP(1/3)\n    Listing expires in 7 days\n    Describe your item (100 chars).\n    Example:\n    iPhone 6 64GB Silver, unlocked\n    --Reply with description or CANCEL",
    "#ACCOUNT\n  1 Afrikaans\n  2 Akan\n  3 Albanian\n  4 Amharic\n  5 Arabic\n  6 Armenian\n  7 Assamese\n  8 Azerbaijani\n  9 Bambara\n 10 Basque\n 11 Belarusian\n 12 Bengali\n 13 Bosnian\n 14 Breton\n 15 Bulgarian\n 16 Burmese\n 17 Catalan\n 18 Chechen\n 19 Chinese\n..1/7\n--MORE/BACK",
    "#POST TUTORIAL\n1 Introduction\n2 How to use\n3 Categories\n4 Credits\n--Reply with prefix/HELP/BACK",
    "DID YOU MEAN?\nA #account\nB #aljazeera\nC #contacts\nD #france24\nE #market\nF #msg\nG #onem\nH #post\nI #reuters\nJ #subscribe\nK #wiki\nL #xgroup\nM #unsubscribe\n--Reply A-M",
    "#MARKET SELL\nA Sell Something in a big way\nB Active listings(1)\nC De-listed(0)\nD Orders to approve(0)\nE Orders to dispatch(0)\nF My profile\n--Reply A-F or BUY or search words",
    "#MARKET BUY\n1+ ITEMS\nA Sell Something\nB healthy(1)\nC fruit(1)\n--Reply A-C or MENU or search words",
    "#FRANCE24 EUROPE\nTitle: US urges Europe to quit Iran deal, stop busting sanctions\nStory: The US lashed out at some of its closest allies Thursday, accusing Britain, France and Germany of trying to bust US sanctions against Iran and calling on\n..01/29\n--MORE/BACK",
    "#MARKET NEW ITEM STEP(1/3)\n    Listing expires in 7 days\n    Describe your item (100 chars).\n    Example:\n    iPhone 6 64GB Silver, unlocked\n    --Reply with description or CANCEL",
    "#ACCOUNT\n  1.1.1 Afrikaans\n  2.2 Akan\n  3 Albanian\n  A Amharic\n  5 Arabic\n  6 Armenian\n  7 Assamese\n  8 Azerbaijani\n  9 Bambara\n 10 Basque\n 11 Belarusian\n 12 Bengali\n 13 Bosnian\n 14 Breton\n 15 Bulgarian\n 16 Burmese\n 17 Catalan\n 18 Chechen\n 19 Chinese\n..1/7\n--MORE/BACK",
    "#ACCOUNT\n  1 Afrikaans\n  2 Akan\n..01/29\n--MORE/BACK",
    "#POST ADD\nA Confirm\nB Back\nYou selected:\nC rgergerg egrregegr\nD rgegr ergegegr\nE Private (share code)\n--Reply A-E",
    "#ACCOUNT\n 1 Afrikaans\n 2 Akan\n 3 Albanian\n 4 Amharic\n 5 Arabic\n 6 Armenian\n 7 Assamese\n 8 Azerbaijani\n 9 Bambara\n10 Basque\n11 Belarusian\n12 Bengali\n13 Bosnian\n14 Breton\n15 Bulgarian\n16 Burmese\n17 Catalan\n18 Chechen\n19 Chinese\n20 Church Slavic\n21 Cornish\n22 Croatian\n23 Czech\n24 Danish\n..1/5\n--MORE/BACK",
    "#XGROUP\nA Create xGroup\n--Reply A/BACK",
    "@testgroup:\nWelcome to group conversation; reply here to send messages to the group.\nExample: @testgroup your message",
    "#XGROUP\nInvite people to your new group\nA From contacts list\nB By ONEm name\nC Invite later\n--Reply A-C/BACK",
    "#MSG\nEnter text to send to: \nchris722\n--send text, or BACK to cancel",
    "#MSG\nThis group has no members",
    "#WIKI (ENGLISH) DARKON (FILM) RANDOM\nA blah Darkon is an award-winning feature-length documentary film that follows the real-life adventures of the Darkon Wargaming Club in Baltimore, Maryland, a group of fantasy live-action role-playing (LARP) gamers. The film\n..1/4\n--MORE",
    "#WIKI LONDON TABLE\n1 Abstract\n2 Toponymy\n3 +History\n4 +Administration\n5 +Geography\n6 +Demography\n7 +Economy\n8 +Transport\n9 +Education\n10 +Culture\n11 Notable peoplen\n12 +Recreation\n13 Sport\n14 See also\n15 Notes\n16 +References\n17 External links\n--Reply with prefix",
    "@a__190227145528:\ntesting11"
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


        // check for existing connection from msisdn already logged in (on another device) and kick them off
        if (socket.msisdn) {
            debug("found existing user");
            if (process.env.TEST !== 'on' && clients.isConnected(socket.msisdn)) {
                clients.forceLogout(socket.msisdn);
            }
            clients.newConnection(socket.msisdn, socket)
            debug("isConnected:" + clients.isConnected(socket.msisdn));
            // deliver any saved messages for this user
            message.deliverPending(socket);
        }

        socket.on('MO SMS', async function (moText) {


            debug('moText: ');
            debug(moText);

            debug("socket.id");
            debug(socket.id);

            if (socket.msisdn) {

                try {
                    if (moText.startsWith('#')) {
                        clients.switchService(socket.msisdn, moText.toLowerCase());
                    }
                     // Todo implement caching in dbmethods
                    if (await dbMethods.serviceIncludes(clients.currentService(socket.msisdn))) {
                        if (nautilus.isSystemVerb(moText)) {
                            debug("executing system verb in nautilus");
                            nautilus.executeSystemVerb(socket.msisdn, common.shortNumber, moText, false);
                        } else {
                            debug("sending SMS to nautilus: " + moText + " from: " + socket.msisdn);
                            nautilus.processMessage(socket.msisdn, common.shortNumber, moText, false);
                        }
                    } else {
                        debug("sending SMS to Short Number " + common.shortNumber + " from: " + socket.msisdn);
                        sms.sendSMS(socket.msisdn, common.shortNumber, moText, false);
                        if (process.env.TEST == 'on') {
    
                            var timer = setTimeout(
                                function () {
                                    if (index == testMessages.length) index = 0;
                                    if (testMessages[index]) socket.emit('MT SMS', { mtText: testMessages[index] });
                                    index++;
                                }, 1000
                            );
                        }
                    }
                } catch (error) {
                    console.log(error);
                }
            } else {
                debug("can't locate msisdn for user");
            }

        });

        socket.on('API MO SMS', function (moText) {
            debug('moText: ');
            debug(moText);

            debug("socket.id");
            debug(socket.id);

            if (socket.msisdn) {

                debug("sending SMS to Short Number " + common.shortNumber + " from: " + socket.msisdn);
                sms.sendSMS(socket.msisdn, common.shortNumber, moText, true);

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
            if (socket.msisdn) delete clients.disconnected(socket.msisdn);
            delete socket.msisdn;
        });
    });
}