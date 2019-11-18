const fs = require("fs")
const util = require("util")
const logger = require('debug-level').log('onem-zone')


const get = function (secret) {
    try {
        // Swarm secret are accessible within tmpfs /run/secrets dir
        const dockerSecret = fs.readFileSync(util.format("/run/secrets/%s", secret), "utf8").trim();
        logger.info(secret + ":" + dockerSecret, + ":"+ process.env[secret]) 
        return dockerSecret ? dockerSecret : process.env[secret]
    }
    catch (e) {
        return process.env[secret];
    }
}


module.exports = {
    channelId: get("CHANNEL_ID"),
    channelType: get("CHANNEL_TYPE") || "SMS",
    rmqHost: get("RMQ_HOST") || 'amqp://localhost'
}