
const debug = require('debug')('onemzone');
const fs = require('fs');
const nodeRSA = require('node-rsa');
const request = require('request-promise');

const GCASH_CLIENT_ID = process.env.GCASH_CLIENT_ID;
const GCASH_CLIENT_SECRET = process.env.GCASH_CLIENT_SECRET;
const GCASH_MERCHANT_ID = process.env.GCASH_MERCHANT_ID;
const GCASH_PRODUCT_CODE = process.env.GCASH_PRODUCT_CODE;
const GCASH_API_BASE_PATH = process.env.GCASH_API_BASE_PATH;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PRIVATE_KEY_PATH = process.env.PRIVATE_KEY_PATH;
const ACCOUNT_GCASH = 'gcash';
const GCASH_ORDER_TITLE = "ONEm wallet top up";
const GCASH_EXTERNAL_USER_TYPE = "online_customer";
const GCASH_CREATE_FUNCTION = process.env.GCASH_CREATE_FUNCTION;
const DEFAULT_SIGNING_SCHEME = 'pkcs1';
const DEFAULT_SIGNING_ALGORITHM = 'sha256';
const HOST_URL = process.env.HOST_URL;
const PAY_RETURN_URL = HOST_URL + '/api/gcash/order_success';
const CANCEL_RETURN_URL = HOST_URL + '/api/gcash/order_fail';
const NOTIFICATION_URL = HOST_URL + '/api/gcash/order_notify';

var privateKey;
if (PRIVATE_KEY_PATH) {
    privateKey = fs.readFileSync(PRIVATE_KEY_PATH, "utf8");
} else if (PRIVATE_KEY) {
    privateKey = PRIVATE_KEY;
} else {
    throw "Missing private key in config";
}

// const request = function() {
//     return Promise.resolve({
//         response:{
//             body:{
//                 resultInfo: {
//                     resultStatus: 'S'
//                 },
//                 checkoutUrl:'/api/gcash/order_success/123456'
//             }
//         }});
// }

exports.Gcash = function() {
    this.clientId = GCASH_CLIENT_ID;
    this.clientSecret = GCASH_CLIENT_SECRET;
    this.merchantId = GCASH_MERCHANT_ID;
    this.apiBasePath = GCASH_API_BASE_PATH;
    this.privateKey = privateKey;
    this.payReturnUrl = PAY_RETURN_URL;
    this.cancelReturnUrl = CANCEL_RETURN_URL;
    this.notificationUrl = NOTIFICATION_URL;
    var options = {
        signingScheme: DEFAULT_SIGNING_SCHEME,
        signingSchemeOptions: {
            hash: DEFAULT_SIGNING_ALGORITHM,
            saltLength: null
        }
    }
    this.key = new nodeRSA(privateKey, DEFAULT_SIGNING_SCHEME, options);
    this.key.importKey(privateKey, DEFAULT_SIGNING_SCHEME);
    this.publicKey = this.key.exportKey(DEFAULT_SIGNING_SCHEME + '-public');
}

// @param
// Object containing properties
//   {
//      reqMsgId: required
//      orderTitle  
exports.Gcash.prototype.placeOrder = async function (amount, currency, email, orderRef) {

    var self = this;
    var now = new Date();

    var order = {
        createdTime: now.toISOString(),
        merchantTransId: orderRef,
        merchantTransType: "Order Payment",
        orderTitle: GCASH_ORDER_TITLE,
        orderAmount: {
            currency: currency,
            value: amount
        },
        buyer: {
            userId: "",  // should be left blank according to gcash team
            externalUserId: email,
            externalUserType: GCASH_EXTERNAL_USER_TYPE
        }
    }

    var r = {
        request: {
            head: {
                version: "2.0",
                function: GCASH_CREATE_FUNCTION,
                //     function:"gcash.acquiring.order.create",
                clientId: self.clientId,
                clientSecret: self.clientSecret,
                reqTime: now.toISOString(),
                reqMsgId: orderRef
            },
            body: {
                merchantId: self.merchantId,
                order: order,
                productCode: GCASH_PRODUCT_CODE,
                subMerchantId: "",
                subMerchantName: "",
                //       mcc: "4789",
                notificationUrls: [
                    {
                        type: "PAY_RETURN",
                        url: self.payReturnUrl + '/' + orderRef
                    },
                    {
                        type: "CANCEL_RETURN",
                        url: self.cancelReturnUrl + '/' + orderRef
                    },
                    {
                        type: "NOTIFICATION",
                        url: self.notificationUrl + '/' + orderRef
                    }
                ],
                envInfo: {
                    orderTerminalType: "WEB",
                    terminalType: "WEB"
                    // appVersion: "",
                    // osType: "Windows 10",
                    // clientIp: "172.16.22.1",
                    // merchantTerminalId: "online_store",
                    // merchantIp: "10.255.152.2",
                    // extendedInfo: {
                    //         payment_type: "GCash"
                    // }
                }
            }
        }
    };

    // the RSA library uses a default signing algorithmn of 'SHA256'
    signature = this.key.sign(r.request, "base64");

    r.signature = signature;
    debug(JSON.stringify(r, {}, 4));

    try {
        debug("url:" + GCASH_API_BASE_PATH + '/create.htm');
        var res = await request({
            method: 'POST',
            url: GCASH_API_BASE_PATH + '/create.htm',
            json: true,
            body: r
        });
        var response = res.response;
        if (!response || !response.body) throw "missing response";
        debug(response.body);
        var resultInfo = response.body.resultInfo;

        if (resultInfo.resultStatus == 'F' || resultInfo.resultStatus == 'f' || !response.body.checkoutUrl || !response.body.merchantTransId) {
            return ({ result: false, message: resultInfo.resultMsg });
        } else {
            return ({
                result: true,
                order: {
                    orderRef: response.body.merchantTransId,
                    checkoutUrl: response.body.checkoutUrl
                },
                message: resultInfo.resultMsg
            });
        }
        return result;
    } catch (error) {
        debug("got error:");
        debug(error);
        throw error;
    }
}