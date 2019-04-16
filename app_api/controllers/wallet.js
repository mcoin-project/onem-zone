const debug = require('debug')('onemzone');
const Order = require('../common/Order').Order;
const junction = require('../common/junction');
//const validAmounts = [100000, 200000, 500000];
const validAmounts = [1000, 2000, 5000];

exports.getAccounts = function (User) {
    return async function (req, res) {
        try {
            var accounts = await junction.getAccounts(req.userProfile.msisdn);
            res.json({ result: true, accounts: accounts });
        } catch (error) {
            res.status(500).send({result: false, message: error});
        }
    }
}

exports.topUp = function (User) {
    return async function (req, res) {

        if (!req.body.amount ||
            !req.body.accountId ||
            !req.body.accountType ||
            !validAmounts.includes(req.body.amount)) {
            return res.status(400).send({message: 'Malformed request'});
        }

        try {
            var order = await new Order(
                req.userProfile.msisdn,
                req.userProfile.email,
                req.body.accountId,
                req.body.accountType,
                req.body.amount,
                req.body.currency
            );
            await order.create();
            var orderResult = await order.place();
            debug("orderResult:");
            debug(orderResult);
            if (!orderResult.result) {
                res.status(502).send({ result: false, message: orderResult.message });
            } else {
                res.json({ result: true, order: orderResult.order, message: orderResult.resultMsg });
            }
        } catch (error) {
            debug(error);
            res.status(500).send({ result: false, message: "Server error" });
        }
    };
}
