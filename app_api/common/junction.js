const debug = require('debug')('onemzone');
//const request = require('request-promise');
const junctionPath = process.env.JUNCTION_BASE_PATH;

const request = function() {
    return Promise.resolve({result:true, amount: 1000, currency: 'PHP'});
}

exports.createOrder = async function (account, msisdn, amount, currency) {
    try {
        var order = await request({
            method: 'POST',
            url: junctionPath + '/order',
            json:true,
            body: {
                account: account,
                msisdn: msisdn,
                amount: amount,
                currency: currency
            }
        });
        debug("created order");
        debug(order);
        return order;
    } catch (error) {
        debug("/createOrder");
        debug(error);
        throw error;
    }
}

exports.updateOrder = async function (orderRef, moreInfo) {
    try {
        var order = await request({
            method: 'PUT',
            url: junctionPath + '/order/' + orderRef,
            json:true,
            body: {
                moreInfo: moreInfo
            }
        });
        debug("updated order");
        debug(order);
        return order;
    } catch (error) {
        debug("/updateOrder");
        debug(error);
        throw error;
    }
}

exports.getOrder = async function (orderRef) {
    try {
        var order = await request({
            method: 'GET',
            url: junctionPath + '/order/' + orderRef
        });
        debug("got order");
        debug(order);
        return order;
    } catch (error) {
        debug("/updateOrder");
        debug(error);
        throw error;
    }
}