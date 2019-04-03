const debug = require('debug')('onemzone');
const Gcash = require('../common/gcash').Gcash;


const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const MERCHANT_ID = process.env.MERCHANT_ID;
const PRODUCT_CODE = process.env.PRODUCT_CODE;
const API_BASE_PATH = process.env.API_BASE_PATH;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PRIVATE_KEY_PATH = process.env.PRIVATE_KEY_PATH;
const PAY_RETURN_URL = 'https://onem-gcash.herokuapp.com/api/gcash/order_success';
const CANCEL_RETURN_URL = 'https://onem-gcash.herokuapp.com/api/gcash/order_fail';
const NOTIFICATION_URL = 'https://onem-gcash.herokuapp.com/api/gcash/order_not_available';

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
    CLIENT_ID,
    CLIENT_SECRET,
    MERCHANT_ID,
    API_BASE_PATH,
    privateKey,
    PAY_RETURN_URL,
    CANCEL_RETURN_URL,
    NOTIFICATION_URL);

exports.getAccounts = function (User) {
    return function (req, res) {
        var accounts = [
            {name: 'gcash', balance: 2345, currency: 'PHP'}
        ];
        res.json({ result: true, accounts: accounts });
    }
}

exports.topUp = function (User) {
    return function (req, res) {
        var order = {
            orderTitle: "ONEm wallet top up",
            orderAmount: {
                currency: "PHP",
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

        gcash.placeOrder(PRODUCT_CODE, order).then(function (response) {
            debug("success");
            debug(response);
            if (response.resultStatus == 'F' || response.resultStatus == 'f' || !response.checkoutUrl) {
                res.status(502).send({ result: false, message: response.resultMsg });
            } else {
                res.json({ result: true, order: response, message: response.resultMsg });
            }
        }).catch(function (error) {
            debug(error);
            res.status(500).send({ result: false, message: "Server error" });
        });
    };
}
