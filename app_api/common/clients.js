const Context = require('./context.js').Context;
const cache = require('./cache.js');
const debug = require('debug')('onemzone');
const DEFAULT_MSG_SIZE = 2;
const MAX_MSG_SIZE = 5;
const MAX_MSG_CHARS = 160;

var clients = {};

var isConnected = async function (msisdn) {
	try {
		var record = await cache.read(msisdn);
		if (!record.init) return false;
		if (!clients[msisdn].socket) return false;
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
}

var newConnection = async function (msisdn, socket) {
	try {
		clients[msisdn] = {};
		clients[msisdn].socket = socket;
		await cache.write(msisdn, {init: true, contextStack: []});
		return true;
	} catch (error) {
		console.log(error);
		return false;
	}
}

var disconnected = async function (msisdn) {
	try {
	//	await cache.remove(msisdn);
		clients[msisdn].socket = undefined;
	} catch (error) {
		console.log(error);
		return false;
	}
}

var newMtMessage = async function (msisdn, mtText, api) {
	debug("/newMtMessage:");

	try {
		var obj = {
			mtText: mtText,
			api: api
		}
		var record = await cache.write(msisdn, obj)
		var size = record.size || DEFAULT_MSG_SIZE;
	//	debug("size:"+size);
	//	debug("mtText length:"+mtText.length);

		var context = await getContext(msisdn);
	//	debug(context.data);
		if (context) {
			if (mtText.length > size * MAX_MSG_CHARS) {
				await context.chunkText(mtText, size * MAX_MSG_CHARS);
			} else {
				await context.clearChunks();
			}

			// var contextData = context.get();
			// var contextStack = record.contextStack;
			// contextStack.push(contextData);
			//await cache.write(msisdn, {contextStack: contextStack});
		} else {
			throw "no context"
		}
	} catch (error) {
		debug("/newMtMessage");
		throw error;
	}
}

var concatMessage = async function (msisdn, mtText) {
	debug("/concatMessage");

	try {
		var record = await cache.read(msisdn);
		var concatMtText;
		if (!record.mtText) {
			concatMtText = mtText;
		} else {
			concatMtText = record.mtText + mtText;
		}
		await cache.write(msisdn, {mtText: concatMtText});
	} catch (error) {
		throw error;
	}
}

var sendMessage = async function (msisdn, mtText) {
	debug("/sendMessage");

	try {

		var context = await getContext(msisdn);
		//await context.resetRequest();
	//	debug(JSON.stringify(context,{},2));
		if (context.hasChunks()) {
			text = context.getChunk();
		} else {
			text = mtText;
		}
		channel = context.api ? 'API MT SMS' : 'MT SMS';
		try {
			clients[msisdn].socket.emit(channel, { mtText: text });
		} catch (error) {
			return false;
		}
		return true;
	} catch (error) {
		throw error;	
	}
}

var forceLogout = async function (msisdn) {
	debug("/forceLogout");

	if (!clients[msisdn].socket) return false;
	try {
		clients[msisdn].socket.emit('LOGOUT');
	} catch (error) {
		await cache.remove(msisdn);
		clients[msisdn] = {};
		return false;
	}
	await cache.remove(msisdn);
	clients[msisdn] = {};
	return true;
}

var switchService = async function (msisdn, moText) {
	debug("/switchService");

	var newService = moText.trim().split(' ')[0].toLowerCase();
	if (!newService || newService == '') return false;
	try {
		var result = await cache.write(msisdn, {currentService: newService});
		return result;
	} catch (error) {
		throw error;
	}
}

var currentService = async function (msisdn) {
	debug("/currentService");

	try {
		var result = await cache.read(msisdn);
		return result.currentService;
	} catch (error) {
		throw error;
	}
}

var getContext = async function (msisdn) {
	debug("/getContext");

	try {
		var record = await cache.read(msisdn);
		if (!record.context) return null;
		var context = new Context(msisdn, record.currentService);
		await context.initialize();
		return context;
	} catch (error) {
		debug(error);
		throw error;
	}
}

var setBody = async function (msisdn, body) {
	debug("/setBody:");

	try {
		var record = await cache.read(msisdn);
		if (record.context) {
			var ctext = record.context;
			ctext.data = body;
			var r = await cache.write(msisdn,{context: ctext});
			debug(r);
			return r;
		} else {
			throw "no context"
		}
	} catch (error) {
		debug(error);
		throw error;
	}
}

var getBody = async function (msisdn) {
	debug("/getBody:");

	try {
		var record = await cache.read(msisdn);
		if (record.context && record.context.data) {
			return record.context.data;
		} else {
			return {};
		}
	} catch (error) {
		debug(error);
		throw error;
	}
}

var pushContext = async function (msisdn) {
	debug("/pushContext");
	var record = await cache.read(msisdn);
	var contextData = await getContext(msisdn);
	var contextStack = record.contextStack;
	if (!contextStack) {
		debug("RESETTING CONTEXTSTACK");
		contextStack = [];
	}
	contextStack.push(contextData);
	await cache.write(msisdn, {contextStack: contextStack});
}

var setContext = async function (msisdn, body) {
	debug("/setContext");

	try {
		var record = await cache.read(msisdn);
		var service = record.currentService;
		//var contextStack = record.contextStack;
		var context = new Context(msisdn, service);
		await context.setBody(body);
		await context.initialize();
		// if (!contextStack) {
		// 	debug("RESETTING CONTEXTSTACK");
		// 	contextStack = [];
		// }
		var contextData = context.get();
		// debug("pushing contextData");
		// debug(contextData.data);
		// contextStack.push(contextData);
		//await cache.write(msisdn, {contextStack: contextStack});
		await cache.write(msisdn, {context: contextData});
		return context;
	} catch (error) {
		throw error;
	}
}

var setApi = async function (msisdn, api) {
	debug("/setApi");

	try {
		await cache.write(msisdn, {api: api});
		return api;
	} catch (error) {
		throw error;
	}
}

var getApi = async function (msisdn) {
	debug("/getApi:");

	try {
		var record = await cache.read(msisdn);
		return record.api || false;
	} catch (error) {
		debug(error);
		throw error;
	}
}

var getMtText = async function (msisdn) {
	debug("/getMtText:");

	try {
		var record = await cache.read(msisdn);
		return record.mtText;
	} catch (error) {
		throw error;
	}
}

var setMtText = async function (msisdn, mtText) {
	debug("/setMtText:");

	try {
		var record = await cache.write(msisdn, {mtText: mtText});
		return record.mtText;
	} catch (error) {
		throw error;
	}
}

var newContext = async function (msisdn, body) {
	debug("/newContext");

	try {
		var record = await cache.read(msisdn);
		var service = record.currentService;
		var context = new Context(msisdn, service);
		await context.setBody(body);
		await context.initialize();
		var contextStack = [];
		await cache.write(msisdn, {contextStack: contextStack});
		return context;
	} catch (error) {
		throw error;
	}
}

var popContext = async function (msisdn) {
	debug("/popContext");
	try {
		var record = await cache.read(msisdn);
		debug(record.contextStack);
		if (record.contextStack && record.contextStack.length > 0) {
			debug(record.contextStack);
			debug("Popped context");
			var ctext = record.contextStack.pop();
			debug(ctext);
			var r = await cache.write(msisdn, {context: ctext, contextStack: record.contextStack});
			debug(r);
			context = new Context(msisdn, record.currentService);
			await context.setBody(ctext.data);
			await context.initialize();	
			debug("isForm:" + context.isForm());
			debug("context.requestNeeded:"+context.requestNeeded());
			debug("record.contextStack.length:"+record.contextStack.length);
			//if (context.isForm() && context.requestNeeded() && record.contextStack.length > 0) {
			if (context.requestNeeded() && record.contextStack.length > 0) {
					debug("popping again");
				var ctext;
				if (record.contextStack.length > 1) {
					ctext = record.contextStack.pop();
				} else {
					ctext = record.contextStack[0];
				}
				debug(ctext);
				await cache.write(msisdn, {context: ctext, contextStack: record.contextStack});
				context = new Context(msisdn, record.currentService);
				await context.setBody(ctext.data);
				await context.initialize();	
			}
		}
		// debug("ctext:");
		// debug(context);
	} catch (error) {
		throw error;
	}
}

var goBack = async function (msisdn) {
	debug("/goBack");
	try {
		var context = await getContext(msisdn);
		if (context.isForm()) {
			debug("isForm");
			await context.goBackInForm();
			if (context.requestNeeded()) {
				debug("requestNeeded");
				await popContext(msisdn);
			}
		} else if (context.isLessChunks()) {
			debug("isLessChunks");
			await context.prev();
		} else {
			debug("else case")
			await popContext(msisdn);
		}
	} catch (error) {
		throw error;
	}
}

var more = async function (msisdn) {
	debug('/more');

	try {
		var context = await getContext(msisdn);
		if (context.hasChunks()) {
			await context.more();
		}
	} catch (error) {
		throw error;
	}
}

var go = async function (msisdn, moText) {
	debug('/go');

	try {
		var record = await cache.read(msisdn);
		var context = record.context;
		if (!context) throw "no context";
		if (Context.prototype.hasChunks.call(context)) {
			var params = moText.split(' ');
			var page = parseInt(params[1]);
			if (params.length == 1) {
				await Context.prototype.go.call(context);
			} else if (isNaN(page) || (typeof page == "number" && page < 1 || page > Context.prototype.numChunks.call(context))) {
				await Context.prototype.go.call(context);
			} else {
				await Context.prototype.go.call(context, page);
			}
		}
	} catch (error) {
		debug('/goBack');
		throw error;
	}
}

var size = async function (msisdn, moText) {
	debug('/size');

	try {
		var context = await getContext(msisdn);
		var record = await cache.read(msisdn);
		var params = moText.split(' ');
		var size = parseInt(params[1]);
		var currentSize = record.size || DEFAULT_MSG_SIZE;
		var header = context.getHeader();
	
		if (params.length == 1) {
			return header + "Current message size is " + currentSize + " (minimum is 1, maximum is " + MAX_MSG_SIZE + ").";
		} else if (typeof size !== "number" || (typeof size == "number" && size < 1 || size > 5)) {
			return header + "SMS supports sizes between 1 and 5. Message size is now " + currentSize + ".";
		} else {
			await cache.write(msisdn, {size: size});
			return header + "Message size is now " + size + ".";
		}
	} catch (error) {
		debug("/size");
		throw error;
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
	pushContext,
	getContext,
	setContext,
	getBody,
	setBody,
	getMtText,
	setMtText,
	getApi,
	setApi,
	newContext,
	goBack,
	size,
	more,
	go
};
