const Aerospike = require('aerospike')
const client = Aerospike.client()
const defaultNamespace = process.env.AEROSPIKE_NAMESPACE
const defaultSet = process.env.AEROSPIKE_SET
const debug = require('debug')('onemzone');

// Establish connection to the cluster
exports.connect = function () {
	return client.connect();
}

// Write a record
exports.write = async function (k, obj) {
	let key = new Aerospike.Key(defaultNamespace, defaultSet, k)
	try {
		if (typeof obj !== "object") throw "Param 2 must be an object"
		for (var prop in obj) {
			if (typeof obj[prop] == "boolean") {
				obj[prop] = obj[prop] ? 1 : 0;
			}
		}
	//	debug("putting object:");
	//	debug(obj);
		await client.put(key, obj)
		let result = await client.get(key)
		debug("returning:");
		debug(result.bins);
		return result.bins
	} catch (error) {
		console.log(error)
		throw error
	}
}
// Read a record
exports.read = async function (k) {
	let key = new Aerospike.Key(defaultNamespace, defaultSet, k)
	try {
		let record = await client.get(key)
	//	debug("cache.read")
	//	debug(record.bins)
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
	let key = new Aerospike.Key(defaultNamespace, defaultSet, k)
	try {
		let result = await client.remove(key)
		return result;
	} catch (error) {
		// Check for errors
		console.log(error)
		throw error
	}
}