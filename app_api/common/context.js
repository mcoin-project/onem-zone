const debug = require('debug')('onemzone');
const common = require('./common');
const options = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

exports.Context = function(apiUrl, JSONdata) {
    this.data = Object.assign({},JSONdata);

    debug("this.data");
    debug(JSON.stringify(this.data,{},4));

    if (!this.data) this.data = {};

    this.apiUrl = apiUrl;
    if (this.data.header && this.data.header.length > 0) {
        this.data.header = this.data.header.toUpperCase() + '\n';
    }
}

exports.Context.prototype.isForm = function() {
    return this.data.type.toLowerCase() == 'form';
}

exports.Context.prototype.isMenu = function() {
    return this.data.type.toLowerCase() == 'menu';
}

exports.Context.prototype.hasOptions = function() {

    if (!this.data.body || this.data.body.length == 0) {
        return false;
    }
    
    for (var i=0; i< this.data.body.length; i++) {
        if (this.data.body[i].type == 'option') {
            return true;
        }
    }
    return false;
}

exports.Context.prototype.makeMTResponse = function() {

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
        result += '--Reply A-' + options[optionIndex].toUpperCase();
        return result;
    } else if (this.isMenu() && !this.data.footer && optionIndex == 0) {
        result += '--Reply A';
        return result;
    }

    if (this.isForm()) {
        result += this.data.body[0].description + '\n';
    }

    if (this.isForm() && !this.data.footer) {
        result += '--Reply with ' + this.data.body[0].name;
    }

    if (this.data.footer) {
        debug("adding footer");
        result += this.data.footer;
        return result;
    }

    return result;

}

exports.Context.prototype.getRequestParams = function(user, moText) {

    var result = {
        url: '',
        method: 'GET',
        json: true,
        headers: {}
    };


    var token = common.createJWT({_id: user });
    result.headers = { Authorization: 'token ' + token };

    var nswymError = function(header, toIndex) {
        debug("nswym: " + header);
        throw {invalidOption: header + 
            "Not sure what you meant. Send an option from A to " +
            options[toIndex].toUpperCase() + "\n--Reply A to " + options[toIndex].toUpperCase()
         };
    }

    // check if it's a service switch, include any text after the service as query params
    if (moText.startsWith('#')) {
        result.url = this.apiUrl + '/' + moText.substring(1, moText.length);
        result.qs = moText.split(' ').slice(1).join(' ');

        if (result.qs.length == 0) result.qs = undefined;

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
            nswymError(this.data.header, optionBodyIndex - 1);
        }
        result.url = this.apiUrl + this.data.body[i].nextRoute;  // todo properly join to handle optional '/'
        result.method = this.data.body[i].method || 'GET';
    }

    if (moText.length > 2 && this.isMenu() && this.hasOptions()) {
        debug("invalidOption:" + this.isMenu());
        nswymError(this.data.header, optionBodyIndex - 1);
    }

    if (this.isForm()) {
        var bodyData = {}
        bodyData[this.data.body[0].name] = moText;
        result.url = this.apiUrl + this.data.nextRoute;   // todo properly join to handle optional '/'
        result.method = this.data.method || 'POST';
        result.body = bodyData;
    }

    return result;
}