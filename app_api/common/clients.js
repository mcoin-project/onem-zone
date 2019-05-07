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
		await cache.write(msisdn, {init: true});
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

	try {
		var obj = {
			mtText: mtText,
			api: api
		}
		var record = await cache.write(msisdn, obj)
		var size = record.size || DEFAULT_MSG_SIZE;
		debug("size:"+size);
		debug("mtText length:"+mtText.length);
		debug("/newMtMessage:");
		debug(record.context.data);
		if (record.context && mtText.length > size * MAX_MSG_CHARS) {

			//might have to getcontext here
		//	var context = await getContext(msisdn);
	//		if (!context) throw "no context"
			
			//await context.chunkText(mtText, size * MAX_MSG_CHARS);
			//var context = Object.assign(new Context, record.context);
			var context = new Context(msisdn, record.currentService, record.context.data);
			await context.initialize();
			await Context.prototype.chunkText.call(context, mtText, size * MAX_MSG_CHARS);
		} else if (record.context) {
	//		var context = await getContext(msisdn);
	//		await context.chunkText(mtText, size * MAX_MSG_CHARS);
			var context = new Context(msisdn, record.currentService, record.context.data);
			await context.initialize();
			await Context.prototype.clearChunks.call(context);
		} else {
			throw "no context"
		}
	} catch (error) {
		debug("/newMtMessage");
		throw error;
	}
}

var concatMessage = async function (msisdn, mtText) {
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
		debug("/concatMessage");
		throw error;
	}
}

var sendMessage = async function (msisdn) {

	try {
		var record = await cache.read(msisdn);
		var text, channel;
		if (!record || !clients[msisdn].socket) throw "no session";
		debug("/sendMessage");
		debug(record.context.chunks);
		debug("chunkPos:"+ record.context.chunkPos);

		var context = new Context(msisdn, record.currentService, record.context.data);
		await context.initialize();
		if (context.hasChunks()) {
			text = context.getChunk();
		} else {
			text = record.mtText;
		}
		channel = record.api ? 'API MT SMS' : 'MT SMS';
		try {
			clients[msisdn].socket.emit(channel, { mtText: text });
		} catch (error) {
			return false;
		}
		return true;
	} catch (error) {
		debug("/sendMessage");
		throw error;	
	}
}

var forceLogout = async function (msisdn) {
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
	try {
		var result = await cache.read(msisdn);
		return result.currentService;
	} catch (error) {
		throw error;
	}
}

var getContext = async function (msisdn) {
	try {
		var record = await cache.read(msisdn);
		if (!record.context) return null;
		var context = new Context(msisdn, record.currentService, record.context.data);
		await context.initialize();
		return context;
	} catch (error) {
		debug("/getContext:");
		debug(error);
		throw error;
	}
}

var setBody = async function (msisdn, body) {
	try {
		await cache.write(msisdn,{body: body});
		return body;
	} catch (error) {
		debug("/setBody:");
		debug(error);
		throw error;
	}
}

var getBody = async function (msisdn) {
	try {
		var record = await cache.read(msisdn);
		if (record.context && record.context.data) {
			return record.context.data;
		} else {
			return {};
		}
	} catch (error) {
		debug("/getBody:");
		debug(error);
		throw error;
	}
}

var setContext = async function (msisdn, body) {

	try {
		var record = await cache.read(msisdn);
		var service = record.currentService;
		var contextStack = record.contextStack;
		var context = new Context(msisdn, service, body);
		await context.initialize();
		await context.save();
		if (!contextStack) {
			contextStack = [];
		}
		var contextData = context.get();
		contextStack.push(contextData);
		await cache.write(msisdn, {contextStack: contextStack});
		return context;
	} catch (error) {
		debug("/newContext");
		throw error;
	}
}

var setApi = async function (msisdn, api) {
	try {
		await cache.write(msisdn, {api: api});
		return api;
	} catch (error) {
		debug("/setAPi");
		throw error;
	}
}

var getApi = async function (msisdn) {
	try {
		var record = await cache.read(msisdn);
		return record.api || false;
	} catch (error) {
		debug("/getApi:");
		debug(error);
		throw error;
	}
}

var getMtText = async function (msisdn) {
	try {
		var record = await cache.read(msisdn);
		return record.mtText;
	} catch (error) {
		debug("/getMtText:");
		debug(error);
		throw error;
	}
}

var newContext = async function (msisdn, body) {

	try {
		var record = await cache.read(msisdn);
		var service = record.currentService;
		var context = new Context(msisdn, service, body);
		await context.initialize();
		await context.save();
		if (!record.contextStack) {
			var contextStack = [];
			await cache.write(msisdn, {contextStack: contextStack});
		}
		return context;
	} catch (error) {
		debug("/newContext");
		throw error;
	}
}

var popContext = async function (msisdn) {
	debug("Popping context");
	try {
		var record = await cache.read(msisdn);
		if (record.contextStack && record.contextStack.length > 0) {
			debug("Popped context");
			var context = record.contextStack.pop();
			await cache.write(msisdn, {context: context, contextStack: record.contextStack});
			if (Context.prototype.isForm.call(context) && Context.prototype.requestNeeded.call(context)) {
				var context = record.contextStack.pop();
				await cache.write(msisdn, {context: context, contextStack: record.contextStack});
			}
		}
		debug("ctext:");
		debug(context);
	} catch (error) {
		debug("/popContext");
		throw error;
	}
}

var goBack = async function (msisdn) {
	try {
		var record = await cache.read(msisdn);
		if (!record.context) throw "no context";
		var context = new Context(msisdn, record.currentService, record.context.data);
		await context.initialize();
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
		debug('/goBack');
		throw error;
	}
}

var more = async function (msisdn) {
	try {
		var record = await cache.read(msisdn);
		if (!record.context) throw "no context";
		var context = new Context(msisdn, record.currentService, record.context.data);
		await context.initialize();
		if (context.hasChunks()) {
			await context.more();
		}
	} catch (error) {
		debug('/goBack');
		throw error;
	}
}

var go = async function (msisdn, moText) {
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

	try {
		var record = await cache.read(msisdn);
		var context = record.context;
		if (!context) throw "no context";

		var params = moText.split(' ');
		var size = parseInt(params[1]);
		var currentSize = record.size || DEFAULT_MSG_SIZE;
		var header = Context.prototype.getHeader.call(context);
	
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
	getContext,
	setContext,
	getBody,
	setBody,
	getMtText,
	getApi,
	setApi,
	newContext,
	goBack,
	size,
	more,
	go
};
