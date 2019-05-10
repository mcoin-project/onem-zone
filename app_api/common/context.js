const debug = require('debug')('onemzone');
const common = require('./common');
const Service = require('../dbMethods/service').Service;
const verbs = require('./verbs');
const OPTIONS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
const MIN_CHUNK_PERCENTAGE = 20 // the minimum % size of a chunk that should be left at the end
const cache = require('./cache.js');

exports.Context = function (msisdn, serviceName) {

    debug("/newContext");
    this.data = {};
    this.verbs = [];
    this.chunks = [];
    this.formInputParams = {};
    this.request = true;
    this.formIndex = 0;
    this.chunkPos = 0;
    this.msisdn = msisdn;
    this.serviceName = serviceName;
    this.mtText = '';

    if (!this.data) this.data = {};

    this.service = new Service(serviceName);
}

exports.Context.prototype.save = async function () {
    debug("/context.save");
    var thisData = {
        verbs: this.verbs,
        chunks: this.chunks,
        formInputParams: this.formInputParams,
        request: this.request,
        formIndex: this.formIndex,
        chunkPos: this.chunkPos,
        msisdn: this.msisdn,
        serviceName: this.serviceName,
        optionStart: this.optionStart,
        optionEnd: this.optionEnd,
        mtText: this.mtText
    }
    thisData.data = Object.assign({}, this.data);

    try {
        await cache.write(this.msisdn, { context: thisData });
    } catch (error) {
        throw error;
    }
}

exports.Context.prototype.get = function () {
    debug("/context.get");

    return {
        verbs: this.verbs,
        chunks: this.chunks,
        formInputParams: this.formInputParams,
        request: this.request,
        formIndex: this.formIndex,
        chunkPos: this.chunkPos,
        msisdn: this.msisdn,
        serviceName: this.serviceName,
        mtText: this.mtText,
        data: this.data
    }
}

exports.Context.prototype.initialize = async function () {
    debug("/context.initialize");

    try {
        var obj = await this.service.get();
        debug("obj:");
        debug(obj);
        this.callbackPath = obj.callbackPath;
        this.verbs = await this.service.getVerbs();
        var record = await cache.read(this.msisdn);
        debug("record for:" + this.msisdn);
        if (record.context) {
            this.request = record.context.request;
            this.data = Object.assign({}, record.context.data);
            if (this.data.header && this.data.header.length > 0 && this.data.header[this.data.header.length - 1] !== '\n') {
                this.data.header = this.data.header.toUpperCase() + '\n';
            }
            this.optionStart = record.context.optionStart;
            this.optionEnd = record.context.optionEnd;
            this.formIndex = record.context.formIndex;
            this.formInputParams = record.context.formInputParams;
            this.mtText = record.context.mtText;
            if (record.context.chunks && record.context.chunks.length > 0) {
                this.chunks = record.context.chunks;
                this.chunkPos = record.context.chunkPos;
            }
        } else {
            debug("NO CONTEXT");
            this.chunkPos = 0;
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

exports.Context.prototype.setBody = async function (body) {
    debug("/setBody");
    if (!body) return false;
    this.data = Object.assign({}, body);
    try {
        await this.save();
        return body;
    } catch (error) {
        debug(error);
        throw error;
    }
}

exports.Context.prototype.getHeader = function () {
    debug("/context.getHeader");

    if (this.data.header) {
        return this.data.header;
    } else {
        return '';
    }
}

exports.Context.prototype.getFooter = function () {
    debug("/context.getFooter");

    if (this.data.footer) {
        return this.data.footer;
    } else {
        return '';
    }
}

exports.Context.prototype.isForm = function () {
    debug("/context.isForm");
    if (!this.data || !this.data.type) {
        debug("no data or type");
        return false;
    }
    debug(this.data.type.toLowerCase() == 'form');
    return this.data.type.toLowerCase() == 'form';
}

exports.Context.prototype.isMenu = function () {
    debug("/context.isMenu");

    if (!this.data || !this.data.type) {
        debug("no data or type");
        return false;
    }
    return this.data.type.toLowerCase() == 'menu';
}

exports.Context.prototype.hasOptions = function () {
    debug("/context.hasOptions");

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
    debug("/context.nuumMenuOptions");

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
    debug("/context.firstOption");

    if (this.numMenuOptions() > OPTIONS.length) {
        return '1';
    } else {
        return 'A';
    }
}

exports.Context.prototype.makeFooter = function () {
    debug("/context.makeFooter");

    if (this.data.footer) {
        return this.data.footer;
    }
    if (this.isMenu() && this.optionEnd) {
        return '--Reply' + ' ' + this.optionStart + '-' + this.optionEnd + this.footerVerbs(true);
    } else if (this.isMenu() && this.optionStart) {
        return '--Reply' + ' ' + this.optionStart + this.footerVerbs(true);
    } else if (this.isMenu()) {
        return '--Reply' + ' ' + this.footerVerbs(true);
    } else if (this.isForm()) {
        return '--Reply with ' + this.data.body.formItems[this.formIndex].name + this.footerVerbs(true);
    } else {
        return '';
    }
}

exports.Context.prototype.resetRequest = async function () {
    this.request = true;
    try {
        await this.save();
        return this.request;

    } catch (error) {
        debug(error);
        throw error;
    }
}

exports.Context.prototype.makeMTResponse = async function () {
    debug("/context.makeMtResponse");
    debug("formIndex:" + this.formIndex);

    var menuOption, result = '';
    var optionIndex = 0;

    if (this.data.header) {
        result += this.data.header;
    }

    var numMenuOptions = this.numMenuOptions();

    if (this.isMenu() && this.data.body && this.data.body.length > 0) {
        for (var i = 0; i < this.data.body.length; i++) {
            if (this.data.body[i].type == "content") {
                this.data.body[i].formatted = this.data.body[i].description + '\n';
                result += this.data.body[i].formatted;
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
                this.data.body[i].formatted = menuOption + ' ' + this.data.body[i].description + '\n';
                result += this.data.body[i].formatted;
                optionIndex++;
            }
        }
        optionIndex--;
    }

    if (numMenuOptions > OPTIONS.length) {
        this.optionStart = '1';
        this.optionEnd = optionIndex + 1;
    } else if (numMenuOptions == 0) {
        this.optionStart = null;
        this.optionEnd = null;
    } else {
        this.optionStart = OPTIONS[0].toUpperCase();
        this.optionEnd = OPTIONS[optionIndex] ? OPTIONS[optionIndex].toUpperCase() : null;
    }

    if (optionIndex == 0) {
        this.optionEnd = null;
    }
    if (this.isMenu()) {
        result += this.makeFooter();
        this.mtText = result;
        try {
            await this.save();
            return result;
        } catch (error) {
            debug(error);
            throw error;
        }
    }

    if (this.isForm()) {
        result += this.data.body.formItems[this.formIndex].description + '\n';
        result += this.makeFooter();
        this.mtText = result;
        if (this.formIndex + 1 < this.data.body.formItems.length) {
            this.request = false;
        } else {
            this.request = true;
        }
    }
    try {
        await this.save();
        return result;
    } catch (error) {
        debug(error);
        throw error;
    }
}

exports.Context.prototype.requestNeeded = function () {
    debug("/context.requestNeeded");
    debug("returning:" + this.request);
    return this.request;
}

exports.Context.prototype.getVerb = function (verb) {
    debug("/context.getVerb:"+verb);
    debug(this.verbs);
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
    debug("/context.footerVerbs");

    var result = "";
    var verbs = [];
    for (var i = 0; i < this.verbs.length; i++) {
        if (this.verbs[i].footer) {
            verbs.push(this.verbs[i].name.toUpperCase());
        }
    }
    result = verbs.join('/');
    if (result.length > 0 && prefix && this.optionStart) {
        result = ' or ' + result;
    }
    return result;
}

exports.Context.prototype.lastOption = function () {
    debug("/context.lastOption");

    var optionCount = this.numMenuOptions();

    if (optionCount > OPTIONS.length) {
        return optionCount.toString();
    } else {
        return OPTIONS[optionCount - 1].toUpperCase();
    }
}

exports.Context.prototype.getOptionInputIndex = function (moText) {
    debug("/context.getOptionInputIndex");

    var numberOfOptions = this.numMenuOptions();
    var optionInputIndex = OPTIONS.indexOf(moText.toLowerCase());
    var optionNum = parseInt(moText);

    if (optionInputIndex !== -1 && numberOfOptions > OPTIONS.length) return false;
    if (!isNaN(optionNum) && (optionNum > numberOfOptions || optionNum < 1)) return false;

    if (typeof optionNum == "number" && optionNum <= numberOfOptions) {
        return optionNum - 1;
    } else {
        return optionInputIndex;
    }
}

exports.Context.prototype.getRequestParams = async function (user, moText) {
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
        debug("/nswymError");
        var lastOption = self.lastOption();
        var firstOption = self.firstOption();
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
        return result;
    }

    var v = this.getVerb(moText);
    debug("v");
    debug(v);
    // check if it's a verb, can switch immediately if so
    if (v) {
        debug("it's a verb");
        result.url = this.callbackPath + '/' + v.route;
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
            debug("type: " + this.data.body[i].type + " optionBodyIndex: " + optionBodyIndex + " optionInputIndex: " + optionInputIndex);
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
        this.request = true;
    }

    if (moText.length > 2 && this.isMenu() && this.hasOptions()) {
        nswymError(this.data.header);
    }

    if (this.isForm()) {
        this.formInputParams[this.data.body.formItems[this.formIndex].name] = moText;
        result.url = this.callbackPath + this.data.body.nextRoute;   // todo properly join to handle optional '/'
        result.method = this.data.body.method || 'POST';
        result.body = this.formInputParams;
        if (moText !== verbs.BACK_VERB && this.formIndex + 1 < this.data.body.formItems.length) {
            this.formIndex++;
        }
    }

    try {
        await this.save();
        return result;

    } catch (error) {
        debug(error);
        throw error;
    }

}

exports.Context.prototype.goBackInForm = async function () {
    debug("/context.goBackInForm");
    if (this.data.body.formItems.length <= 1) {
        debug("REQUEST IS NEEDED");
        this.formIndex = 0;
        this.request = true;
    } else if (this.formIndex - 1 >= 0) {
        this.formIndex--;
        this.request = false;
        debug("REQUEST IS NOT NEEDED");
    } else {
        debug("ELSE REQUEST IS NEEDED");
        this.formIndex = 0;
        this.request = true;
    }

    try {
        await this.save();
    } catch (error) {
        debug(error);
        throw error;
    }

}

exports.Context.prototype.go = async function (page) {
    debug("/context.go:" + page);
    if (arguments.length == 0 || isNaN(page) || typeof page !== "number" || page < 1 || page > this.chunks.length) {
        page = 0;
    } else {
        page = page - 1;
    }
    this.chunkPos = page;

    try {
        await this.save();
        return this.chunkPos;

    } catch (error) {
        debug(error);
        throw error;
    }

}

exports.Context.prototype.clearChunks = async function () {
    debug("/context.clearChunks");
    this.chunks = [];
    this.chunkPos = 0;

    try {
        await this.save();
        return true;

    } catch (error) {
        debug(error);
        throw error;
    }

}

exports.Context.prototype.more = async function () {
    debug("/context.more");
    if (this.chunks.length > 0 && this.chunkPos < this.chunks.length - 1) {
        this.chunkPos++;
    } else {
        this.chunkPos = 0;
    }
    try {
        await this.save();
        return this.chunkPos;

    } catch (error) {
        debug(error);
        throw error;
    }

}

exports.Context.prototype.prev = async function () {
    debug("/context.prev");
    if (this.chunkPos > 0) {
        this.chunkPos--;
    } else {
        this.chunkPos = 0;
    }
    try {
        await this.save();
        return this.chunkPos;

    } catch (error) {
        debug(error);
        throw error;
    }

}

exports.Context.prototype.getChunk = function () {

    debug("/getChunk: chunkPos:" + this.chunkPos);

    if (this.hasChunks()) {
        return this.chunks[this.chunkPos];
    } else {
        return "No chunks available.";
    }
}

exports.Context.prototype.isMoreChunks = function () {
    debug("/context.isMoreChunks");
    return this.chunkPos < this.chunks.length && this.chunks.length > 0;
}

exports.Context.prototype.numChunks = function () {
    debug("/context.numChunks");

    if (this.chunks) {
        return this.chunks.length;
    } else {
        return 0;
    }
}

exports.Context.prototype.isLessChunks = function () {
    debug("/context.isLessChunks");

    return this.chunkPos > 0 && this.chunks.length > 0;
}

exports.Context.prototype.hasChunks = function () {
    debug("/context.haschunks");
    return this.chunks && this.chunks.length && this.chunks.length > 0;
}

exports.Context.prototype.setChunkingFooterPages = async function () {
    debug("/context.setChunkingFooterPages");

    if (this.chunks.length > 1) {
        // locate footer
        for (var i = 0; i < this.chunks.length; i++) {
            var lines = this.chunks[i].split('\n');
            lastLine = lines[lines.length - 2];
            lines[lines.length - 2] = lastLine.replace('/xx', '/' + this.chunks.length);
            this.chunks[i] = lines.join('\n');
        }
        try {
            await this.save();
        } catch (error) {
            debug(error);
            throw error;
        }
    }
}

var chunkForm = async function (mtText, formDescription, chunkSize) {
    debug("/context.chunkForm");

    var i, chunk = '';
    var footerLength = 10 + verbs.MORE_VERB.length + 1 + (this.footerVerbs(false)).length;
    var chunkTargetLength = chunkSize - footerLength;
    var moreToChunk = false;

    // check if chunksize needs to be adjusted to balance the chunks
    if (mtText.length % chunkTargetLength < (chunkSize * MIN_CHUNK_PERCENTAGE / 100)) {
        chunkTargetLength = chunkTargetLength * (1 - (MIN_CHUNK_PERCENTAGE / 100));
        chunkSize = chunkSize * (1 - (MIN_CHUNK_PERCENTAGE / 100));
    }

    if (this.data.header && this.data.header.length > 0) {
        chunk += this.data.header;
    }

    if (this.data.body && this.data.body.formItems && this.data.body.formItems.length > 0) {
        chunk += formDescription;
    }

    if (chunk.length > chunkTargetLength) {
        var chunkResult = removeWordsFromEnd(chunk, chunkTargetLength);
        chunk = chunkResult.chunk;
        if (chunkResult.remainder.length > 0) {
            moreToChunk = true;
        }
    }

    if (moreToChunk) {
        var chunkFooter = addChunkingFooter.bind(this);
        chunk = chunkFooter(chunk);
    } else {
        chunk += this.makeFooter();
    }
    debug("pushing")
    debug(chunk);
    this.chunks.push(chunk);

    if (chunk.length > chunkTargetLength) {
        var chunkF = chunkForm.bind(this);
        return chunkF(mtText, chunkResult.remainder, chunkSize);
    }
    await this.setChunkingFooterPages();

    debug("chunks:")
    debug(this.chunks);

    try {
        await this.save();
        return;

    } catch (error) {
        debug(error);
        throw error;
    }
}

var removeLastLine = function (text) {
    debug("/context.removeLastLine");

    var lines = text.split('\n');
    if (lines.length > 1) {
        if (lines[lines.length - 1] == '') lines.pop();
        lines.pop();
    }
    return lines.join('\n');
}

var removeWordsFromEnd = function (text, target) {
    debug("/context.removewordsFromEnd");

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
    if (result.remainder.length > 0 && result.remainder[result.remainder.length-1] !== '\n') {
        result.remainder += '\n';
    }
    debug(result);
    return result;
}

var addChunkingFooter = function (chunk) {
    debug("/context.addChunkingFooter");

    var result = chunk;

    if (result[result.length - 1] !== '\n') {
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

var chunkMenu = async function (mtText, start, chunkSize, remainder) {
    debug("/chunkMenu:" + chunkSize);

    var i=start, chunk = '';
    var footerLength = 10 + verbs.MORE_VERB.length + 1 + (this.footerVerbs(false)).length;
    var chunkTargetLength = chunkSize - footerLength;
    var moreToChunk = false;

    // check if chunksize needs to be adjusted to balance the chunks
    if (mtText.length % chunkTargetLength < (chunkSize * MIN_CHUNK_PERCENTAGE / 100)) {
        chunkTargetLength = chunkTargetLength * (1 - (MIN_CHUNK_PERCENTAGE / 100));
        chunkSize = chunkSize * (1 - (MIN_CHUNK_PERCENTAGE / 100));
    }

    if (start == 0) {
        this.chunks = [];
        this.chunkPos = 0;
        if (this.data.header && this.data.header.length > 0) {
            chunk += this.data.header;
        }
    }

    if (remainder && remainder.length > 0) {
        chunk += remainder;
        debug("added remainer:");
        debug(chunk);
    }

    if (chunk.length < chunkTargetLength && this.data.body && this.data.body.length > 0) {
        while (i < this.data.body.length && chunk.length < chunkTargetLength) {
            chunk += this.data.body[i].formatted;
            i++;
        }

        if (i > start) {
            i--;
        }
    
        if (chunk.length > chunkTargetLength) {
            moreToChunk = true;
            debug("chunk.length:"+chunk.length);
            debug(chunk);
            debug("chunkTargetLength:"+chunkTargetLength);
        
            if (this.data.body[i].type == "content") {
                var chunkResult = removeWordsFromEnd(chunk, chunkTargetLength);
                debug("chunkResult:");
                debug(chunkResult);
               // this.data.body[i].formatted = chunkResult.chunk;
                chunk = chunkResult.chunk;
                remainder = chunkResult.remainder;
                i++;
                // if (chunkResult.remainder.length > 0) {
                //     moreToChunk = true;
                // }
            } else if (this.data.body[i].type == "option") {
                chunk = removeLastLine(chunk);
            }
        }

    } else if (chunk.length > chunkTargetLength) {
        debug("chunk is too big");
        var chunkResult = removeWordsFromEnd(chunk, chunkTargetLength);
        remainder = chunkResult.remainder;
        chunk = chunkResult.chunk;
        moreToChunk = true;
    }

    debug("i:"+i);

    // if (i < this.data.body.length) {
    //     moreToChunk = true;
    // }

    if (moreToChunk) {
        var chunkFooter = addChunkingFooter.bind(this);
        debug("chunkFooter:")
        debug(chunk);
        chunk = chunkFooter(chunk);
    } else {
        chunk += this.makeFooter();
    }
    debug("pushing chunk");
    debug(chunk);
    debug("remainder:"+remainder);
    this.chunks.push(chunk);

    if (moreToChunk) {
        var chunkM = chunkMenu.bind(this);
        return chunkM(mtText, i, chunkSize, remainder);
    }
    await this.setChunkingFooterPages();

    debug(this);

    try {
        await this.save();
        return;

    } catch (error) {
        debug(error);
        throw error;
    }

}

exports.Context.prototype.chunkText = async function (mtText, chunkSize) {
    debug("/context.chunkText");
    if (this.isMenu()) {
        var chunk = await chunkMenu.bind(this);
        return chunk(mtText, 0, chunkSize, '');
    } else {
        var formDescription = this.data.body.formItems[this.formIndex].description;
        var chunk = await chunkForm.bind(this);
        return chunk(mtText, formDescription, chunkSize);
    }
}
