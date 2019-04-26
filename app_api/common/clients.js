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
	if (!clients[msisdn]) clients[msisdn] = {};
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
	return clients[msisdn].context;
}

var setContext = function(msisdn, context) {
	if (!clients[msisdn]) return false;
	clients[msisdn].context = Object.assign({}, context);
	return clients[msisdn].context;
}

var getMtText = function(msisdn) {
	if (!clients[msisdn]) return false;
	return clients[msisdn].mtText;
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
	getMtText
};
