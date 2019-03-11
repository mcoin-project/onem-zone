debugger;

const debug = require('debug')('onemzone');
const moment = require('moment');
const smppSystemId = process.env.SMPP_SYSTEMID || "autotest";
const smppPassword = process.env.SMPP_PASSWORD || "password";
const smppPort = process.env.SMPP_PORT || 2775;
const shortNumber = process.env.SHORT_NUMBER || "444100";
const clients = require('../common/clients.js');
const common = require('../common/common.js');
const message = require('../controllers/message.js');

var smpp = require('smpp');

var stateMsg = {
    'ENROUTE': { 'Value': 1, 'Status': 'ENROUTE' },
    'DELIVERED': { 'Value': 2, 'Status': 'DELIVRD' },
    'EXPIRED': { 'Value': 3, 'Status': 'EXPIRED' },
    'DELETED': { 'Value': 4, 'Status': 'DELETED' },
    'UNDELIVERABLE': { 'Value': 5, 'Status': 'UNDELIV' },
    'ACCEPTED': { 'Value': 6, 'Status': 'ACCEPTD' },
    'UNKNOWN': { 'Value': 7, 'Status': 'UNKNOWN' },
    'REJECTED': { 'Value': 8, 'Status': 'REJECTD' }
};
var dlrFeature = process.env.DLR || 'on';
var referenceCSMS = 0; // CSMS reference number that uniquely identify a split sequence of SMSes.
var idMsg = 0;

var smppSession; // the SMPP session context saved globally.

debug("smppport:"+smppPort)

var smppServer = smpp.createServer(function(session) {

    // var alreadySent = false;
    var mtText = '';
    var i, resObj;

    smppSession = session; // save the session globally

    session.on('bind_transceiver', function(pdu) {
        debug('Bind request received, system_id:' + pdu.system_id + ' password:' + pdu.password);
        // we pause the session to prevent further incoming pdu events,
        // untill we authorize the session with some async operation.
        session.pause();

        if (!(pdu.system_id == smppSystemId && pdu.password == smppPassword)) {
            session.send(pdu.response({
                command_status: smpp.ESME_RBINDFAIL
            }));
            debug('Error binding');
            session.close();
            return;
        }
        debug('Successfully bound');
        session.send(pdu.response());
        session.resume();
    });

    session.on('enquire_link', function(pdu) {
        debug('enquire_link received');
        session.send(pdu.response());
    });

    session.on('unbind', function(pdu) {
        debug('unbind received, closing session');
        session.send(pdu.response());
        session.close();
    });

    smppSession.on('submit_sm', function(pdu) {

        //The delivery reports are sent to the client using the 'deliver_sm' packet.
        //This is the same packet as used to deliver incoming messages.
        //To detect whether a 'deliver_sm' is a delivery report or a message, you have to check the 'esm_class' field.
        //    If bit 2 of this byte is set ( 0x04 ), it is a delivery report.
        //The delivery status is encoded in the 'short_message' field as an ASCII text message and it is also added as SMS options.
        //The delivery receipts will be sent once for the whole concatenated message,
        //    so multi part messages will get a single delivery receipt, when the last part is received and the message is sent to the web client.
        //Various fields are used in delivery reports:
        var submitDate = moment().format('YYMMDDHHmm'); //The submitting moment is the moment when 'submit_sm' event is fired.
        var doneDate = moment().format('YYMMDDHHmm'); //The delivering moment will be updated later on, when the message will be sent over Socket.IO connection.
        var statMsg = stateMsg.DELIVERED.Status; //'DELIVRD'; // \_The state of the message is encoded with both letters and numbers
        var statMsgValue = stateMsg.DELIVERED.Value; // / The default state of the message is "delivered"
        var errMsg = '000'; //No error in message delivery.
        var dlvrdMsg = '001'; //One message delivered. This is a constant for our server since we do not support multiple recipients. Actually it does support multiple messages!
        var endmsgText = 20; //The snippet of message to be transmitted back in delivery report will be of maximum 20 characters.
        var msgText = 'Message acknowledged';
        var hexidMsg = idMsg.toString(16); //idMsg is a global identifier, at the server level. It will be sent back to submitter
        //in both the submit response and in the delivery reports; it is the same for a certain message.
        var pad = '00000000000000000000'; //idMsg should be sent as 20 hex digits zero padded.
        var client = clients.clients[pdu.destination_addr];

        hexidMsg = pad.substring(0, pad.length - hexidMsg.length) + hexidMsg; //TODO: If hexidMsg longer than 20 digits (!!!) display its last 20 digits
        smppSession.send(pdu.response({ message_id: hexidMsg })); //submit_response; we've received the submit from the ESME and we confirm it with the message_id

        debug("submit_sm received, sequence_number: " + pdu.sequence_number + " isResponse: " + pdu.isResponse());

        if (pdu.short_message.length === 0) {
            debug("** payload being used **");
            mtText = pdu.message_payload;
        } else {
            mtText = pdu.short_message.message;
        }

        debug("mtText: " + mtText);
        debug("more messages: " + pdu.more_messages_to_send);

        if (!client) {
            client = {};
            client.moRecord = {
                mtText: ''
            }
        }
        debug("Client found!");
        client.moRecord.mtText = client.moRecord.mtText + mtText; // build up the text to be sent to the web client.

        // if the session is found but there are more messages to come, then concatenate the message and stop (wait for final message before sending)
        if (pdu.more_messages_to_send === 1) {
            debug("More mesages to send, so returning!");
            return;
        }

        // We're here only for the last message; if this is the last message in the sequence, we can:
        //   1) delete the session
        //   2) retrieve the saved/concatenated message string
        //   3) reset the message string to blank
        //   4) send the result back to the client using the saved session
        if (pdu.more_messages_to_send === 0 || typeof pdu.more_messages_to_send === 'undefined') {
            debug("There are no more messages to be received for it!");
            if (typeof client.moRecord.socket !== 'undefined') {
                try {
                    debug("trying response: " + client.moRecord.mtText);
                    var channel = 'MT SMS';
                    if (client.moRecord.api) {
                        console.log("responding on MT API channel");
                        channel = 'API MT SMS';
                    }
                    client.moRecord.socket.emit(channel, { mtText: client.moRecord.mtText }); //Send the whole message at once to the web exports.clients.
                    doneDate = moment().format('YYMMDDHHmm'); // This is the delivery moment. Record it for delivery reporting.

                    if (client.moRecord.mtText.length < 20) {
                        endmsgText = client.moRecord.mtText.length;
                    };
                    msgText = client.moRecord.mtText.substring(0, endmsgText);
                } catch (err) {
                    debug("oops no session: " + err);
                    doneDate = moment().format('YYMMDDHHmm');
                    statMsg = stateMsg.DELETED.Status; //'DELETED'; // If the socket emit fails, we lose this message. It is in deleted state.
                    statMsgValue = stateMsg.DELETED.Value;
                    errMsg = '001'; // Error sending the message
                    dlvrdMsg = '000'; // No message was delivered
                    common.sendEmail(pdu.destination_addr, client.moRecord.mtText);

                    // don't save api messages
                    if (!client.moRecord.api) {
                        message.save(pdu.source_addr, pdu.destination_addr, client.moRecord.mtText);
                    }
                };
            } else {
                common.sendEmail(pdu.destination_addr, client.moRecord.mtText);
                message.save(pdu.source_addr, pdu.destination_addr, client.moRecord.mtText);
            }
            client.moRecord.mtText = '';
        } else {
            doneDate = moment().format('YYMMDDHHmm');
            statMsg = stateMsg.UNDELIVERABLE.Status; //'UNDELIV'; //If no exports.clients.found to send this message to, this message is undeliverable.
            statMsgValue = stateMsg.UNDELIVERABLE.Value;
            errMsg = '001'; // Error sending the message
            dlvrdMsg = '000'; // No message was delivered
        };

        if ((pdu.registered_delivery & 0x01) == 0x01 && dlrFeature.toLowerCase() !== 'off') { //If the submitted message requested a delivery receipt we build and send back the delivery request.
            //if((pdu.registered_delivery & pdu.REGISTERED_DELIVERY.FINAL) == pdu.REGISTERED_DELIVERY.FINAL){
            var dlReceipt = '';

            var pos = msgText.length <= 10 ? msgText.length : 10;
            var dlrText = msgText.substr(0, pos);

            if (dlrFeature.toLowerCase() === 'fail') {
                statMsg = stateMsg.REJECTED.Status; // 
                statMsgValue = stateMsg.REJECTED.Value;
                errMsg = '001'; // Error sending the message
                dlvrdMsg = '000'; // No message was delivered
            }

            //This is the text to be sent in the message text of the delivery receipt:
            dlReceipt = 'id:' + hexidMsg + ' sub:001 dlvrd:' + dlvrdMsg +
                ' submit date:' + submitDate + ' done date:' + doneDate + ' stat:' + statMsg + ' err:' + errMsg + ' text:' + dlrText;

            debug("sending DLR: " + dlReceipt);

            smppSession.deliver_sm({
                source_addr: pdu.destination_addr, //Send back the delivery receipt to the submitter as if it was sent by the recipient of the message
                source_addr_ton: 1,
                source_addr_npi: 0,
                destination_addr: shortNumber, //send it to the service short number
                destination_addr_ton: 1,
                destination_addr_npi: 0,
                esm_class: 4, //This is a delivery receipt
                data_coding: 0,
                short_message: dlReceipt,
                message_state: statMsgValue, // \_ These two message options should be added to a delivery receipt
                receipted_message_id: hexidMsg // /
            }, function(pdu) {
                if (pdu.command_status === 0) {
                    // Message successfully sent
                    debug("Delivery receipt sent!");
                }
            });
        };

        idMsg++; //it counts the messages that were processed: they were tried to be delivered, successfully or not.

    });

    smppSession.on('deliver_sm', function(pdu) {
        debug("deliver_sm received: " + pdu);
        if (pdu.esm_class == 4) {
            var shortMessage = pdu.short_message;
            debug('Received DR: %s', shortMessage.trim());
            smppSession.send(pdu.response());
        }
    });

});

exports.sendSMS = function(from, to, text) {

    var textLength = text.length;

    if (smppSession) {
        if (text.length <= 70) {

            var buffer = new Buffer(2 * textLength);
            for (var i = 0; i < textLength; i++) {
                buffer.writeUInt16BE(text.charCodeAt(i), 2 * i);
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
                    // Message successfully sent
                    debug("Message sent!");
                }
            });
        } else {
            var shortMessageLength = 0;
            var messageNumber = 0;
            var udh = new Buffer(6);
            var messagePartsNumber = 0;

            messagePartsNumber = Math.floor(textLength / 70);
            if (messagePartsNumber * 70 != textLength) messagePartsNumber++;

            udh.writeUInt8(0x05, 0); //Length of the UDF
            udh.writeUInt8(0x00, 1); //Indicator for concatenated message
            udh.writeUInt8(0x03, 2); //Subheader Length ( 3 bytes)
            udh.writeUInt8(referenceCSMS, 3); //Same reference for all concatenated messages  
            udh.writeUInt8(messagePartsNumber, 4); //Number of total messages in the concatenation

            while (textLength > 0) {
                if (textLength > 70) {
                    shortMessageLength = 70;
                    textLength -= 70
                } else {
                    shortMessageLength = textLength;
                    textLength = 0;
                };

                udh.writeUInt8(messageNumber + 1, 5); //Sequence number (used by the mobile to concatenate the split messages)

                var buffer = new Buffer(2 * shortMessageLength);
                for (var i = 0; i < shortMessageLength; i++) {
                    buffer.writeUInt16BE(text.charCodeAt(i + (70 * messageNumber)), 2 * i);
                };

                messageNumber++;
                smppSession.deliver_sm({
                    source_addr: from,
                    source_addr_ton: 1,
                    source_addr_npi: 0,
                    destination_addr: to,
                    destination_addr_ton: 1,
                    destination_addr_npi: 0,
                    data_coding: 8,
                    short_message: { udh: udh, message: buffer }
                }, function(pdu) {
                    if (pdu.command_status === 0) {
                        // Message successfully sent
                        debug("Multipart message sent!");
                    }
                });

            };
            referenceCSMS++;
            if (referenceCSMS >= 256) referenceCSMS = 0;
        };
    };
}

exports.initialize = function() {
    smppServer.listen(smppPort);
}

