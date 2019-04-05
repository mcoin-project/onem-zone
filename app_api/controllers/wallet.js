const debug = require('debug')('onemzone');
const Gcash = require('../common/gcash').Gcash;
const junction = require('../common/junction');

const GCASH_CLIENT_ID = process.env.GCASH_CLIENT_ID;
const GCASH_CLIENT_SECRET = process.env.GCASH_CLIENT_SECRET;
const GCASH_MERCHANT_ID = process.env.GCASH_MERCHANT_ID;
const GCASH_PRODUCT_CODE = process.env.GCASH_PRODUCT_CODE;
const GCASH_API_BASE_PATH = process.env.GCASH_API_BASE_PATH;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PRIVATE_KEY_PATH = process.env.PRIVATE_KEY_PATH;

var hostUrl = process.env.HOST_URL;
const PAY_RETURN_URL = hostUrl + '/api/gcash/order_success';
const CANCEL_RETURN_URL = hostUrl + '/api/gcash/order_fail';
const NOTIFICATION_URL = hostUrl + '/api/gcash/order_notify';

var fs = require('fs');
var privateKey;
var fs = require('fs');
if (PRIVATE_KEY_PATH) {
    privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
} else if (PRIVATE_KEY) {
    privateKey = PRIVATE_KEY;
} else {
    throw "Missing private key in config";
}

var gcash = new Gcash(
    GCASH_CLIENT_ID,
    GCASH_CLIENT_SECRET,
    GCASH_MERCHANT_ID,
    GCASH_API_BASE_PATH,
    privateKey,
    PAY_RETURN_URL,
    CANCEL_RETURN_URL,
    NOTIFICATION_URL);

exports.getAccounts = function (User) {
    return function (req, res) {
        var accounts = [
            { name: 'gcash', balance: 2345, currency: 'PHP' }
        ];
        res.json({ result: true, accounts: accounts });
    }
}

exports.topUp = function (User) {
    return async function (req, res) {

        try {
            var orderResult;
            var krakenOrder = await junction.createOrder(req.body.account,
                req.userProfile.msisdn,
                req.body.amount,
                req.body.currency);
    
            debug("topping up:" + req.body.account);
            var order = {
                orderTitle: "ONEm wallet top up",
                orderAmount: {
                    currency: req.body.currency,
                    value: req.body.amount
                },
                buyer: {
                    //    userId: req.userProfile.msisdn,
                    userId: "",  // should be left blank according to gcash team
                    externalUserId: req.userProfile.email,
                    externalUserType: "online_customer"
                }
            }
    
            debug("placing order");
            debug(JSON.stringify(order, {}, 4));
            debug("ref:" + krakenOrder.orderRef);
    
            var response = await gcash.placeOrder(GCASH_PRODUCT_CODE, order, krakenOrder.orderRef);
            debug("success");
            debug(response);
            if (response.resultStatus == 'F' || response.resultStatus == 'f' || !response.checkoutUrl) {
                orderResult = false;
                res.status(502).send({ result: false, message: response.resultMsg });
            } else {
                orderResult = true;
                order.orderRef = krakenOrder.orderRef;
                order.checkoutUrl = response.checkoutUrl;
                res.json({ result: true, order: order, message: response.resultMsg });
            }
            await junction.updateOrder(krakenOrder.orderRef, orderResult, response.resultMsg);
        } catch (error) {
            debug(error);
            res.status(500).send({ result: false, message: "Server error" });
        }
    };
}
