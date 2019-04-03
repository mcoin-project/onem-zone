const debug = require('debug')('onemzone');
const common = require('./common');
const options = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
const Service = require('../dbMethods/service').Service;

exports.Context = function (serviceName, JSONdata, verbs) {
    this.data = Object.assign({}, JSONdata);
    this.verbs = verbs;
    if (!this.verbs) this.verbs = [];

    debug("this.verbs");
    debug(this.verbs);

    debug("this.data");
    debug(JSON.stringify(this.data, {}, 4));

    if (!this.data) this.data = {};

    this.service = new Service(serviceName);

    if (this.data.header && this.data.header.length > 0) {
        this.data.header = this.data.header.toUpperCase() + '\n';
    }
}

exports.Context.prototype.initialize = async function () {
    var obj = await this.service.get();
    debug("obj");
    debug(obj);
    this.callbackPath = obj.callbackPath;
    debug("this.callbackPath");
    debug(this.callbackPath);
}

exports.Context.prototype.isForm = function () {
    if (!this.data || !this.data.type) {
        debug("no data or type");
        return false;
    }
    return this.data.type.toLowerCase() == 'form';
}

exports.Context.prototype.isMenu = function () {
    if (!this.data || !this.data.type) {
        debug("no data or type");
        return false;
    }
    return this.data.type.toLowerCase() == 'menu';
}

exports.Context.prototype.hasOptions = function () {

    if (!this.data.body || this.data.body.length == 0) {
        return false;
    }

    for (var i = 0; i < this.data.body.length; i++) {
        if (this.data.body[i].type == 'option') {
            return true;
        }
    }
    return false;
}

exports.Context.prototype.makeMTResponse = function () {

    var result = '';
    var optionIndex = 0;

    if (this.data.header) {
        result += this.data.header;
    }

    if (this.isMenu() && this.data.body && this.data.body.length > 0) {
        for (var i = 0; i < this.data.body.length; i++) {
            if (this.data.body[i].type == "content") {
                result += this.data.body[i].description + '\n'
            } else if (this.data.body[i].type == "option") {
                result += options[optionIndex].toUpperCase() + ' ' + this.data.body[i].description + '\n'
                optionIndex++;
            }
        }
        optionIndex--;
    }

    if (this.isMenu() && !this.data.footer && optionIndex >= 0) {
        result += '--Reply A-' + options[optionIndex].toUpperCase() + this.footerVerbs();
        return result;
    } else if (this.isMenu() && !this.data.footer && optionIndex == 0) {
        result += '--Reply A' + this.footerVerbs();
        return result;
    }

    if (this.isForm()) {
        result += this.data.body.formItems[0].description + '\n';
    }

    if (this.isForm() && !this.data.footer) {
        result += '--Reply with ' + this.data.body.formItems[0].name + this.footerVerbs();
    }

    if (this.data.footer) {
        debug("adding footer");
        result += this.data.footer;
        return result;
    }

    return result;

}

exports.Context.prototype.getVerb = function (verb) {
    var i;
    for (i = 0; i < this.verbs.length; i++) {
        if (verb.toLowerCase() == this.verbs[i].name) {
            debug("found");
            break;
        }
    }
    return i < this.verbs.length ? this.verbs[i] : false;
}

exports.Context.prototype.footerVerbs = function () {
    var result = "";
    var verbs = [];
    for (var i = 0; i < this.verbs.length; i++) {
        if (this.verbs[i].footer) {
            verbs.push(this.verbs[i].name.toUpperCase());
        }
    }
    result = verbs.join('/');
    if (result.length > 0) {
        result = ' or ' + result;
    }
    return result;
}

exports.Context.prototype.lastOption = function () {
    var optionIndex = -1;
    for (var i = 0; i < this.data.body.length; i++) {
        // debug("type:" + context.body[i].type + "optionBodyIndex:" + optionBodyIndex + " optionInputIndex:" + optionBodyIndex );
        if (this.data.body[i].type == 'option') {
            optionIndex++;
        }
    }

    return optionIndex == -1 ? options[0].toUpperCase() : options[optionIndex].toUpperCase();
}
exports.Context.prototype.getRequestParams = function (user, moText) {

    var makeQs = function (userInput) {
        var result = {};
        var words = userInput.split(' ');
        for (var i = 1; i < words.length; i++) {
            var paramValue = "param" + i;
            result[paramValue] = words[i];
        }
        return words.length > 0 ? result : undefined;
    }

    var self = this;
    var result = {
        url: '',
        method: 'GET',
        json: true,
        headers: {}
    };

    var token = common.createJWT({ _id: user });
    result.headers = { Authorization: 'token ' + token };

    var nswymError = function (header) {
        var lastOption = self.lastOption();
        debug("nswym: " + header);
        throw {
            invalidOption: header +
                "Not sure what you meant. Send an option from A to " +
                lastOption + "\n--Reply A to " + lastOption + self.footerVerbs()
        };
    }

    // check if it's a service switch, include any text after the service as query params
    if (moText.startsWith('#')) {
        result.url = this.callbackPath + '/' + this.service.name;
        result.qs = makeQs(moText);
        debug("service switch:");
        debug(result);
        return result;
    }

    var v = this.getVerb(moText);
    // check if it's a verb, can switch immediately if so
    if (v) {
        result.url = this.callbackPath + '/' + v.route;
        debug("it's a verb");
        debug(result);
        return result;
    }

    if (moText.length <= 2 && this.isMenu() && this.hasOptions()) {
        var optionInputIndex = options.indexOf(moText.toLowerCase());
        var optionBodyIndex = 0;

        // try to locate a matching option
        for (var i = 0; i < this.data.body.length; i++) {
            // debug("type:" + context.body[i].type + "optionBodyIndex:" + optionBodyIndex + " optionInputIndex:" + optionBodyIndex );
            if (this.data.body[i].type == 'option' && optionBodyIndex == optionInputIndex) {
                break;
            } else if (this.data.body[i].type == 'option') {
                optionBodyIndex++;
            }
        }
        debug("i:" + i);
        if (i == this.data.body.length) {
            nswymError(this.data.header);
        }
        result.url = this.callbackPath + this.data.body[i].nextRoute;  // todo properly join to handle optional '/'
        result.method = this.data.body[i].method || 'GET';
    }

    if (moText.length > 2 && this.isMenu() && this.hasOptions()) {
        debug("invalidOption:" + this.isMenu());
        nswymError(this.data.header);
    }

    if (this.isForm()) {
        var bodyData = {}
        bodyData[this.data.body.formItems[0].name] = moText;
        result.url = this.callbackPath + this.data.body.nextRoute;   // todo properly join to handle optional '/'
        result.method = this.data.body.method || 'POST';
        result.body = bodyData;
    }

    return result;
}