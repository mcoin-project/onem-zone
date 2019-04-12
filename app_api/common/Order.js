const debug = require('debug')('onemzone');
const junction = require('../common/junction');
const Gcash = require('../common/Gcash').Gcash;
const ACCOUNT_GCASH = "gcash";

var gcash = new Gcash();

exports.Order = function (msisdn, email, account, amount, currency) {
    if (!msisdn || !email || !account || !amount || !currency) {
        throw "missing params";
    }
    this.msisdn = msisdn;
    this.email = email;
    this.account = account;
    this.amount = amount;
    this.currency = currency;
    this.orderRef = undefined;
}
exports.Order.prototype.create = async function () {
    var self = this;
    try {
        var krakenOrder = await junction.createOrder(
            self.account,
            self.msisdn,
            self.amount,
            self.currency
        );
        self.orderRef = krakenOrder.orderRef;
    } catch (error) {
        throw error;
    }
}

exports.Order.prototype.place = async function () {
    var self = this;
    if (!self.orderRef) throw "missing order reference";
    switch (self.account.toLowerCase()) {
        case ACCOUNT_GCASH:
            try {
                var result = await gcash.placeOrder(
                    self.amount,
                    self.currency,
                    self.email,
                    self.orderRef
                );
                await junction.updateOrder(self.orderRef, result.result, result.message);
                return result;
            } catch (error) {
                throw error;
            }
            break;
        default:
            throw "unknown account type: " + self.account;
    }
}

