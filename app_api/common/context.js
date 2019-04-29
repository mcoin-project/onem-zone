const debug = require('debug')('onemzone');
const common = require('./common');
const OPTIONS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
const Service = require('../dbMethods/service').Service;

exports.Context = function (serviceName, JSONdata) {
    this.data = Object.assign({}, JSONdata);
    this.verbs = [];
    this.formInputParams = {};
    this.request = true;
    this.formIndex = 0;

    debug("this.data");
    debug(JSON.stringify(this.data, {}, 4));

    if (!this.data) this.data = {};

    this.service = new Service(serviceName);

    if (this.data.header && this.data.header.length > 0) {
        this.data.header = this.data.header.toUpperCase() + '\n';
    }
}

exports.Context.prototype.initialize = async function () {
    try {
        var obj = await this.service.get();
        debug("obj");
        debug(obj);
        this.callbackPath = obj.callbackPath;
        this.verbs = await this.service.getVerbs();
        debug("this.callbackPath");
        debug(this.callbackPath);
    } catch (error) {
        console.log(error);
        throw error;
    }
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

exports.Context.prototype.numMenuOptions = function () {
    var count = 0;
    if (this.isMenu() && this.data.body && this.data.body.length > 0) {
        for (var i = 0; i < this.data.body.length; i++) {
            if (this.data.body[i].type == "option") {
                count++;
            }
        }
        return count;
    } else {
        return 0;
    }
}

exports.Context.prototype.firstOption = function () {
    if (this.numMenuOptions() > OPTIONS.length) {
        return '1';
    } else {
        return 'A';
    }
}

exports.Context.prototype.makeMTResponse = function () {

    var menuOption, result = '';
    var optionIndex = 0, optionStart = OPTIONS[0].toUpperCase();

    if (this.data.header) {
        result += this.data.header;
    }

    var numMenuOptions = this.numMenuOptions();

    if (this.isMenu() && this.data.body && this.data.body.length > 0) {
        for (var i = 0; i < this.data.body.length; i++) {
            if (this.data.body[i].type == "content") {
                result += this.data.body[i].description + '\n'
            } else if (this.data.body[i].type == "option") {
                if (numMenuOptions > OPTIONS.length) {
                    if (optionIndex < 9) {
                        menuOption = ' ';
                    } else {
                        menuOption = '';
                    }
                    menuOption = menuOption + (optionIndex + 1);
                } else {
                    menuOption = OPTIONS[optionIndex].toUpperCase();
                }
                result += menuOption + ' ' + this.data.body[i].description + '\n'
                optionIndex++;
            }
        }
        optionIndex--;
    }

    if (numMenuOptions > OPTIONS.length) {
        optionStart = '1';
        optionEnd = optionIndex + 1;
    } else {
        optionEnd = OPTIONS[optionIndex].toUpperCase();
    }

    if (this.isMenu() && !this.data.footer && optionIndex >= 0) {
        result += '--Reply' + ' ' + optionStart + '-' + optionEnd + this.footerVerbs();
        return result;
    } else if (this.isMenu() && !this.data.footer && optionIndex == 0) {
        result += '--Reply' + ' ' + optionStart + this.footerVerbs();
        return result;
    }

    if (this.isForm()) {
        result += this.data.body.formItems[this.formIndex].description + '\n';
        if (!this.data.footer) {
            result += '--Reply with ' + this.data.body.formItems[this.formIndex].name + this.footerVerbs();
        }
        if (this.formIndex + 1 < this.data.body.formItems.length) {
            this.request = false;
            debug("REQUEST IS NOT NEEDED");
        } else {
            this.request = true;
        }
    }

    if (this.data.footer) {
        debug("adding footer");
        result += this.data.footer;
        return result;
    }

    return result;

}

exports.Context.prototype.requestNeeded = function () {
    return this.request;
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
    var optionCount = this.numMenuOptions();

    if (optionCount > OPTIONS.length) {
        return optionCount.toString();
    } else {
        return OPTIONS[optionCount - 1].toUpperCase();
    }
}

exports.Context.prototype.getOptionInputIndex = function (moText) {
    var numberOfOptions = this.numMenuOptions();
    var optionInputIndex = OPTIONS.indexOf(moText.toLowerCase());
    var optionNum = parseInt(moText);

    if (optionInputIndex !== -1 && numberOfOptions > OPTIONS.length) return false;
    if (optionNum == NaN || optionNum > numberOfOptions || optionNum < 1) return false;

    if (typeof optionNum == "number" && optionNum <= numberOfOptions) {
        return optionNum - 1;
    } else {
        return optionInputIndex;
    }
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

    var nswymError = function (header) {
        var lastOption = self.lastOption();
        var firstOption = self.firstOption();
        debug("nswym: " + header);
        throw {
            invalidOption: header +
                "Not sure what you meant. Send an option from " + firstOption + " to " +
                lastOption + "\n--Reply " + firstOption + " to " + lastOption + self.footerVerbs()
        };
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

        var optionInputIndex = this.getOptionInputIndex(moText);

        if (optionInputIndex === false) {
            nswymError(this.data.header);
        }
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
        debug("setting formInputParams");
        debug(this.data.body.formItems[this.formIndex].name);
        this.formInputParams[this.data.body.formItems[this.formIndex].name] = moText;
        result.url = this.callbackPath + this.data.body.nextRoute;   // todo properly join to handle optional '/'
        result.method = this.data.body.method || 'POST';
        result.body = this.formInputParams;
        this.formIndex++;
    }

    return result;
}

exports.Context.prototype.goBackInForm = function () {
    if (this.isForm()) {
        if (this.formIndex - 1 >= 0) {
            this.formIndex--;
            this.request = false;
            debug("REQUEST IS NOT NEEDED");
        } else {
            this.request = true;
        }
    } else {
        if (clients[msisdn].contextStack) {
            clients[msisdn].context = clients[msisdn].contextStack.pop();
            this.request = true;
        }
    }
}
