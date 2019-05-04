const Aerospike = require('aerospike')
const client = Aerospike.client()
const defaultNamespace = process.env.AEROSPIKE_NAMESPACE
const defaultSet = process.env.AEROSPIKE_SET

// Establish connection to the cluster
exports.connect = function () {
	return client.connect();
}

// Write a record
exports.write = async function (k, obj) {
	let key = new Aerospike.Key(defaultNamespace, defaultSet, k)
	try {
		if (typeof obj !== "object") throw "Param 2 must be an object"
		await client.put(key, obj)
		return true
	} catch (error) {
		console.log(error)
		return false;
	}
}
// Read a record
exports.read = async function (k) {
	let key = new Aerospike.Key(defaultNamespace, defaultSet, k)
	try {
		let record = await client.get(key)
		console.log(record.bins);
		return record.bins
	} catch (error) {
		// Check for errors
		console.log(error)
		return false;
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
		return false;
	}
}