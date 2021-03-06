const debug = require('debug')('onemzone');
const common = require('./common');
const Service = require('../dbMethods/service').Service;
const verbs = require('./verbs');
const OPTIONS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
const MIN_CHUNK_PERCENTAGE = 20 // the minimum % size of a chunk that should be left at the end

exports.Context = function (serviceName, JSONdata) {
    this.data = Object.assign({}, JSONdata);
    this.verbs = [];
    this.chunks = [];
    this.formInputParams = {};
    this.request = true;
    this.formIndex = 0;
    this.chunkPos = 0;

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

exports.Context.prototype.getHeader = function () {
    if (this.data.header) {
        return this.data.header;
    } else {
        return '';
    }
}

exports.Context.prototype.getFooter = function () {
    if (this.data.footer) {
        return this.data.footer;
    } else {
        return '';
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

exports.Context.prototype.makeFooter = function () {
    if (this.data.footer) {
        debug("adding custom footer");
        return this.data.footer;
    }
    if (this.isMenu() && typeof this.optionEnd !== 'undefined') {
        return '--Reply' + ' ' + this.optionStart + '-' + this.optionEnd + this.footerVerbs(true);
    } else if (this.isMenu() && typeof this.optionEnd == 'undefined') {
        return '--Reply' + ' ' + this.optionStart + this.footerVerbs(true);
    }
    if (this.isForm()) {
        return '--Reply with ' + this.data.body.formItems[this.formIndex].name + this.footerVerbs(true);
    } else {
        return '';
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
                this.data.body[i].__formatted = this.data.body[i].description + '\n';
                result += this.data.body[i].__formatted;
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
                this.data.body[i].__formatted = menuOption + ' ' + this.data.body[i].description + '\n';
                result += this.data.body[i].__formatted;
                optionIndex++;
            }
        }
        optionIndex--;
    }

    if (numMenuOptions > OPTIONS.length) {
        this.optionStart = '1';
        this.optionEnd = optionIndex + 1;
    } else {
        this.optionStart = OPTIONS[0].toUpperCase();
        this.optionEnd = OPTIONS[optionIndex].toUpperCase();
    }

    if (optionIndex == 0) {
        this.optionEnd = undefined;
    }
    if (this.isMenu()) {
        result += this.makeFooter();
        return result;
    }

    if (this.isForm()) {
        result += this.data.body.formItems[this.formIndex].description + '\n';
        result += this.makeFooter();
        if (this.formIndex + 1 < this.data.body.formItems.length) {
            this.request = false;
            debug("REQUEST IS NOT NEEDED");
        } else {
            this.request = true;
        }
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

exports.Context.prototype.footerVerbs = function (prefix) {
    var result = "";
    var verbs = [];
    for (var i = 0; i < this.verbs.length; i++) {
        if (this.verbs[i].footer) {
            verbs.push(this.verbs[i].name.toUpperCase());
        }
    }
    result = verbs.join('/');
    if (result.length > 0 && prefix) {
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
    if (isNaN(optionNum) || optionNum > numberOfOptions || optionNum < 1) return false;

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
                lastOption + "\n--Reply " + firstOption + " to " + lastOption + self.footerVerbs(true)
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
        debug(this.formInputParams);
        result.url = this.callbackPath + this.data.body.nextRoute;   // todo properly join to handle optional '/'
        result.method = this.data.body.method || 'POST';
        result.body = this.formInputParams;
        if (this.formIndex + 1 < this.data.body.formItems.length) {
            this.formIndex++;
        }
    }

    return result;
}

exports.Context.prototype.goBackInForm = function () {
    if (this.formIndex - 1 >= 0) {
        this.formIndex--;
        this.request = false;
        debug("REQUEST IS NOT NEEDED");
    } else {
        debug("REQUEST IS NEEDED");
        this.formIndex = 0;
        this.request = true;
    }
}

exports.Context.prototype.go = function (page) {
    debug("page:"+page);
    debug(typeof page);
    if (arguments.length == 0 || isNaN(page) || typeof page !== "number" || page < 1 || page > this.chunks.length) {
        page = 0;
    } else {
        page = page -1;
    }
    this.chunkPos = page;
    debug("chunkPos:"+this.chunkPos);
    return this.chunkPos;
}

exports.Context.prototype.clearChunks = function () {
    this.chunks = [];
    this.chunkPos = 0;
    return true;
}

exports.Context.prototype.more = function () {
    if (this.chunks.length > 0) {
        this.chunkPos++;
    }
    return this.chunkPos;
}

exports.Context.prototype.prev = function () {
    if (this.chunkPos > 0) {
        this.chunkPos--;
    }
    return this.chunkPos;
}

exports.Context.prototype.getChunk = function () {
    if (this.hasChunks()) {
        return this.chunks[this.chunkPos];
    } else {
        return "No chunks available.";
    }
}

exports.Context.prototype.isMoreChunks = function () {
    return this.chunkPos < this.chunks.length && this.chunks.length > 0;
}

exports.Context.prototype.numChunks = function () {
    if (this.chunks) {
        return this.chunks.length;
    } else {
        return 0;
    }
}

exports.Context.prototype.isLessChunks = function () {
    return this.chunkPos > 0 && this.chunks.length > 0;
}

exports.Context.prototype.hasChunks = function () {
    return this.chunks && this.chunks.length && this.chunks.length > 0;
}

exports.Context.prototype.setChunkingFooterPages = function () {
    if (this.chunks.length > 1) {
        // locate footer
        for (var i=0; i< this.chunks.length; i++) {
            var lines = this.chunks[i].split('\n');
            lastLine = lines[lines.length-2];
            lines[lines.length-2] = lastLine.replace('/xx', '/' + this.chunks.length);
            this.chunks[i] = lines.join('\n');
        }
    }
}

var chunkForm = function (mtText, chunkSize, context) {
    return mtText;
}

var removeLastLine = function (text) {
    var lines = text.split('\n');
    debug("lines:");
    debug(lines);
    if (lines.length > 1) {
        if (lines[lines.length - 1] == '') lines.pop();
        lines.pop();
    }
    return lines.join('\n');
}

var removeWordsFromEnd = function (text, target) {

    totalLength = function (arr) {
        return arr.reduce(function (a, b) {
            return a + b.length + 1;
        }, 0);
    }
    var words = text.split(' ');
    var removedWords = [];

    var result = {
        chunk: '',
        remainder: ''
    };
    while (totalLength(words) > target + 1) {
        removedWords.unshift(words[words.length - 1]);
        words.pop();
    }
    if (words.length == 0) {
        // have to strip char by char
        result.remainder = text.slice(target, target.length);
        result.chunk = text.slice(0, target);
    } else {
        result.remainder = removedWords.join(' ');
        result.chunk = words.join(' ').trim();
    }
    return result;
}

var addChunkingFooter = function (chunk, context) {

    var result = chunk;

    if (result[result.length -1] !== '\n') {
        result += '\n';
    }

    result +=
    ".." +
    (this.chunks.length + 1) +
    "/xx\n" +
    "--" +
    verbs.MORE_VERB.toUpperCase() +
    "/" +
    this.footerVerbs(false);

    return result;
}

var chunkMenu = function (mtText, start, chunkSize) {
    debug("chunkSize:" + chunkSize);

    var i, chunk = '';
    var footerLength = 10 + verbs.MORE_VERB.length + 1 + (this.footerVerbs(false)).length;
    var chunkTargetLength = chunkSize - footerLength;
    var moreToChunk = false;

    debug("chunkTargetLength:" + chunkTargetLength);
    debug("chunkSize:" + chunkSize);
    debug("footerLength:" + footerLength);

    // check if chunksize needs to be adjusted to balance the chunks
    if (mtText.length % chunkTargetLength < (chunkSize * MIN_CHUNK_PERCENTAGE / 100)) {
        chunkTargetLength = chunkTargetLength * (1 - (MIN_CHUNK_PERCENTAGE / 100));
        chunkSize = chunkSize * (1 - (MIN_CHUNK_PERCENTAGE / 100));
    }

    debug("chunkTargetLength:" + chunkTargetLength);
    debug("chunkSize:" + chunkSize);

    if (start == 0) {
        this.chunks = [];
        this.chunkPos = 0;
        if (this.data.header && this.data.header.length > 0) {
            chunk += this.data.header;
        }
    }
    if (this.data.body && this.data.body.length > 0) {
        for (i = start; i < this.data.body.length && chunk.length < chunkTargetLength; i++) {
            if (this.data.body[i].__formatted) {
                chunk += this.data.body[i].__formatted;
            }
        }
    }
    if (i < this.data.body.length) {
        moreToChunk = true;
    }
    if (i > start) {
        i--;
    }

    if (chunk.length > chunkTargetLength) {
        if (this.data.body[i].type == "content") {
            var chunkResult = removeWordsFromEnd(chunk, chunkTargetLength);
            chunk = chunkResult.chunk;
            this.data.body[i].__formatted = chunk.remainder;
            if (chunk.remainder.length > 0) {
                moreToChunk = true;
            }
        } else if (this.data.body[i].type == "option") {
            chunk = removeLastLine(chunk);
            //  i++;
        }
    }

    if (moreToChunk) {
        var chunkFooter = addChunkingFooter.bind(this);
        chunk = chunkFooter(chunk); 
    } else {
        chunk += this.makeFooter();
    }

    console.log("chunk length:" + chunk.length);

    this.chunks.push(chunk);
    debug("chunk length:" + chunk.length);
    debug(chunk);
    if (i < this.data.body.length - 1) {
        var chunkM = chunkMenu.bind(this);
        return chunkM(mtText, i, chunkSize);
    }
    this.setChunkingFooterPages();
    return;
}

exports.Context.prototype.chunkText = function (mtText, chunkSize) {
    if (this.isMenu()) {
        var chunk = chunkMenu.bind(this);
        return chunk(mtText, 0, chunkSize);
    } else {
        var chunk = chunkMenu.bind(this);
        return chunk(mtText, chunkSize);
    }
}
