const context = require('./context.js');
const debug = require('debug')('onemzone');
const DEFAULT_MSG_SIZE = 2;
const MAX_MSG_SIZE = 5;

var clients = {};

var isConnected = function(msisdn) {
	if (!clients[msisdn]) return false;
	if (!clients[msisdn].socket) return false;
    return true;
}

var newConnection = function(msisdn, socket) {
	if (!clients[msisdn]) clients[msisdn] = {};
	clients[msisdn].socket = socket;
}

var disconnected = function(msisdn) {
	if (!clients[msisdn]) clients[msisdn] = {};
	clients[msisdn].socket = undefined;
}

var newMtMessage = function(msisdn, mtText, api) {
	if (!clients[msisdn]) clients[msisdn] = {};
	clients[msisdn].mtText = mtText;
	clients[msisdn].api = api;
}

var concatMessage = function(msisdn, mtText) {
	if (!clients[msisdn]) clients[msisdn] = {mtText: ''};
	clients[msisdn].mtText += mtText;
}

var sendMessage = function(msisdn) {
	if (!clients[msisdn] || !clients[msisdn].socket) throw "no session";
	var text = clients[msisdn].mtText;
	var channel = clients[msisdn].api ? 'API MT SMS' : 'MT SMS';
	try {
		clients[msisdn].socket.emit(channel, { mtText:text });
		clients[msisdn].mtText = '';
	} catch (error) {
		return false;
	}
	return true;
}

var forceLogout = function(msisdn) {
    if (!clients[msisdn] || !clients[msisdn].socket) return false;
	try {
		clients[msisdn].socket.emit('LOGOUT');
	} catch (error) {
        clients[msisdn] = {};
        return false;
	}
    clients[msisdn] = {};
    return true;
}

var switchService = function(msisdn, moText) {
    if (!clients[msisdn]) return false;
	clients[msisdn].currentService = moText.trim().split(' ')[0].toLowerCase();
	return true;
}

var currentService = function(msisdn) {
	return clients[msisdn].currentService || undefined;
}

var getContext = function(msisdn) {
	if (!clients[msisdn]) return false;
	debug("getContext:");
	debug(clients[msisdn].context);
	return clients[msisdn].context;
}

var setBody = function(msisdn, body) {
	if (!clients[msisdn]) return false;
	clients[msisdn].body = Object.assign({}, body);
	return clients[msisdn].body;
}

var getBody = function(msisdn) {
    if (!clients[msisdn]) return false;
	return clients[msisdn].body;
}

var setContext = function(msisdn, context) {
	if (!clients[msisdn]) return false;
	clients[msisdn].context = Object.assign({}, context);
	return clients[msisdn].context;
}

var setApi = function(msisdn, api) {
	if (!clients[msisdn]) return false;
	clients[msisdn].api = api;
	return clients[msisdn].api;
}

var getApi = function(msisdn) {
	if (!clients[msisdn]) return false;
	return clients[msisdn].api;
}

var getMtText = function(msisdn) {
	if (!clients[msisdn]) return false;
	return clients[msisdn].mtText;
}

var newContext = async function(msisdn, body) {
	if (!clients[msisdn]) return false;
	var service = clients[msisdn].currentService;
	clients[msisdn].context = new context.Context(service, body);
	if (!clients[msisdn].contextStack) {
		clients[msisdn].contextStack = [];
	}
	await clients[msisdn].context.initialize();
	clients[msisdn].contextStack.push(clients[msisdn].context);
	return clients[msisdn].context;
}

var goBack = function (msisdn) {
	if (!clients[msisdn]) return false;

	if (clients[msisdn].context.isForm()) {
		clients[msisdn].context.goBackInForm();
    } else if (clients[msisdn].contextStack.length > 1) {
		debug("Popping context");
        clients[msisdn].context = clients[msisdn].contextStack.pop();
        clients[msisdn].context = clients[msisdn].contextStack.pop();

	}
}

var size = function (msisdn, moText) {
	if (!clients[msisdn]) return false;

	var params = moText.split(' ');
	var size = parseInt(params[1]);
	var currentSize = clients[msisdn].size || DEFAULT_MSG_SIZE;
	var header;

	try {
		header = clients[msisdn].context.data.header;
	} catch (error) {
		header = '';
	}
	if (params.length == 1) {
		return header + "Current message size is " +currentSize + " (minimum is 1, maximum is " + MAX_MSG_SIZE + ").";
	} else if (typeof size !== "number" || (typeof size == "number" && size <1 || size >5)){
		return header + "SMS supports sizes between 1 and 5. Message size is now " + currentSize + ".";
	} else {
		clients[msisdn].size = size;
		return header + "Message size is now " + size + ".";
	}
}

module.exports = {
	isConnected,
	newConnection,
	disconnected,
	newMtMessage,
	concatMessage,
    sendMessage,
	forceLogout,
	switchService,
	currentService,
	getContext,
	setContext,
	getBody,
	setBody,
	getMtText,
	getApi,
	setApi,
	newContext,
	goBack,
	size
};
