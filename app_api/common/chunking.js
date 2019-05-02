const verbs = require('./verbs');
const debug = require('debug')('onemzone');
const MIN_CHUNK_PERCENTAGE = 20 // the minimum % size of a chunk that should be left at the end

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
    (context.chunks.length + 1) +
    "/xx\n" +
    "--" +
    verbs.MORE_VERB.toUpperCase() +
    "/" +
    context.footerVerbs(false);

    return result;
}

var chunkMenu = function (mtText, start, chunkSize, context) {
    debug("chunkSize:" + chunkSize);

    var i, chunk = '';
    var footerLength = 10 + verbs.MORE_VERB.length + 1 + (context.footerVerbs(false)).length;
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
        context.chunks = [];
        context.chunkPos = 0;
        if (context.data.header && context.data.header.length > 0) {
            chunk += context.data.header;
        }
    }
    if (context.data.body && context.data.body.length > 0) {
        for (i = start; i < context.data.body.length && chunk.length < chunkTargetLength; i++) {
            chunk += context.data.body[i].formatted;
        }
    }
    if (i < context.data.body.length) {
        moreToChunk = true;
    }
    if (i > start) {
        i--;
    }

    if (chunk.length > chunkTargetLength) {
        if (context.data.body[i].type == "content") {
            var chunkResult = removeWordsFromEnd(chunk, chunkTargetLength);
            chunk = chunkResult.chunk;
            context.data.body[i].formatted = chunk.remainder;
            if (chunk.remainder.length > 0) {
                moreToChunk = true;
            }
        } else if (context.data.body[i].type == "option") {
            chunk = removeLastLine(chunk);
            //  i++;
        }
    }

    if (moreToChunk) {
        chunk = addChunkingFooter(chunk, context); 
    } else {
        chunk += context.makeFooter();
    }

    console.log("chunk length:" + chunk.length);

    context.chunks.push(chunk);
    debug("chunk length:" + chunk.length);
    debug(chunk);
    if (i < context.data.body.length - 1) {
        return chunkMenu(mtText, i, chunkSize, context);
    }
    context.setChunkingFooterPages();
    return;
}

exports.chunkText = function (mtText, chunkSize, context) {
    if (context.isMenu()) {
        return chunkMenu(mtText, 0, chunkSize, context);
    } else if (context.isForm()) {
        return chunkForm(mtText, chunkSize, context);
    }
}
