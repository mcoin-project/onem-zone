require('dotenv').config();

const API_BASE_PATH = process.env.API_BASE_PATH;

const DEFAULT_SIGNING_SCHEME = 'pkcs1';
const DEFAULT_SIGNING_ALGORITHM = 'sha256';

const nodeRSA = require('node-rsa');
const request = require('request-promise');

exports.Gcash = function (clientId,
    clientSecret,
    merchantId,
    apiBasePath,
    privateKey,
    payReturnUrl,
    cancelReturnUrl,
    notificationUrl) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.merchantId = merchantId;
    this.apiBasePath = apiBasePath;
    this.privateKey = privateKey;
    this.payReturnUrl = payReturnUrl;
    this.cancelReturnUrl = cancelReturnUrl;
    this.notificationUrl = notificationUrl;
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
exports.Gcash.prototype.placeOrder = async function (productCode, orderObject, msgId) {

    var self = this;
    var now = new Date();
    if (!arguments[msgId]) {
        msgId = 'A' + now.getTime();
    }

    if (!orderObject.createdTime) {
        orderObject.createdTime = now.toISOString();
    }

    if (!orderObject.merchantTransId) {
        orderObject.merchantTransId = msgId;
    }

    if (!orderObject.merchantTransType) {
        orderObject.merchantTransType = "Order Payment";
    }

    var r = {
        request: {
            head: {
                version: "2.0",
                function: "alipayplus.acquiring.order.create",
                clientId: self.clientId,
                clientSecret: self.clientSecret,
                reqTime: now.toISOString(),
                reqMsgId: msgId
            },
            body: {
                merchantId: self.merchantId,
                order: orderObject,
                productCode: productCode,
                subMerchantId: "",
                subMerchantName: "",
                //       mcc: "4789",
                notificationUrls: [
                    {
                        type: "PAY_RETURN",
                        url: self.payReturnUrl
                    },
                    {
                        type: "CANCEL_RETURN",
                        url: self.cancelReturnUrl
                    },
                    {
                        type: "NOTIFICATION",
                        url: self.notificationUrl
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

    //console.log("text");
    //console.log(JSON.stringify(r.request));

    //console.log("signature");
    //console.log(signature);

    r.signature = signature;
    console.log(JSON.stringify(r, {}, 4));

    try {
        console.log("url:" + API_BASE_PATH + '/create.htm');
        var response = await request({ method: 'POST', url: API_BASE_PATH + '/create.htm', json: true, body: r });
        console.log(response.response.body.resultInfo);
        return response.response.body.resultInfo;
        //console.log(response);
    } catch (error) {
        console.log("got error:");
        console.log(error);
        throw error;
    }
}