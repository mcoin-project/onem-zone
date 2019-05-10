const Aerospike = require('aerospike')
const client = Aerospike.client()
const defaultNamespace = process.env.AEROSPIKE_NAMESPACE
const defaultSet = process.env.AEROSPIKE_SET

const debug = require('debug')('onemzone');

var options = {}
if (process.env.NODE_ENV !== "production") {
	options.totalTimeout= 5000000
}
debug("options:");
debug(options)

// Establish connection to the cluster
exports.connect = function () {
	return client.connect();
}

// Write a record
exports.write = async function (k, obj) {
	debug("/cache.write");
	let key = new Aerospike.Key(defaultNamespace, defaultSet, k)
	try {
		if (typeof obj !== "object") throw "Param 2 must be an object"
		for (var prop in obj) {
			if (typeof obj[prop] == "boolean") {
				obj[prop] = obj[prop] ? 1 : 0;
			} else if (typeof obj[prop] == "undefined") {
				obj[prop] = null;
			}
		}
		await client.put(key, obj, {}, options)
		let result = await client.get(key, options)
		return result.bins
	} catch (error) {
		console.log(error)
		throw error
	}
}
// Read a record
exports.read = async function (k) {
	debug("/cache.read")
	let key = new Aerospike.Key(defaultNamespace, defaultSet, k)
	try {
		let record = await client.get(key, options)
		return record.bins
	} catch (error) {
		if (error.code == Aerospike.status.ERR_RECORD_NOT_FOUND) {
			return null
		}
		throw error
	}
}

// Delete a record
exports.remove = async function (k) {
	debug("/cache.remove");
	let key = new Aerospike.Key(defaultNamespace, defaultSet, k)
	try {
		let result = await client.remove(key, options)
		return result;
	} catch (error) {
		console.log(error)
		throw error
	}
}