const debug = require('debug')('onemzone');
const request = require('request-promise');
const junctionPath = process.env.JUNCTION_BASE_PATH;

// const request = function () {

//     function makeid(length) {
//         var text = "";
//         var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

//         for (var i = 0; i < length; i++)
//             text += possible.charAt(Math.floor(Math.random() * possible.length));

//         return text;
//     }
//     var orderRef = makeid(10);
//     return Promise.resolve({ result: true, orderRef: orderRef, amount: 100000, currency: 'PHP' });
// }

var accountsTest = [
    { id: '11', type:'gcash', name: 'gcash', balance: 12345, currency: 'PHP' }
];

exports.getAccounts = async function (msisdn) {
    try {
        var accounts = await request({
            method: 'GET',
            json: true,
            url: junctionPath + '/accounts/' + msisdn
        });
        debug("got accounts");
        debug(accounts);
        return accounts;
        //        return accounts;

    } catch (error) {
        debug("/getAccounts");
        debug(error);
        throw error;
    }
}

//
// returns
//  {result:boolean, orderRef: string}
// example
//  {result:true, orderRef: 'DD34334323'}
//
exports.createOrder = async function (accountId, msisdn, amount, currency) {
    if (!accountId || !msisdn || !amount || !currency) {
        throw "missing params";
    }
    try {
        var order = await request({
            method: 'POST',
            url: junctionPath + '/merchantOrder',
            json: true,
            body: {
                accountId: accountId,
                msisdn: msisdn,
                amount: amount,
                currency: currency
            }
        });
        debug("created order");
        debug(order);
        if (!order.result) {
            throw "failed to create order"
        }
        var result = {};
        result.result = order.result;
        result.orderRef = order.orderRef;
        return result;
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
            json: true,
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