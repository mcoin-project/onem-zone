var http = require('http');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var methodOverride = require('method-override');
var session = require('express-session');
var bodyParser = require('body-parser');
var multer = require('multer');
var errorHandler = require('errorhandler');
var request = require('request');
var fs = require('fs');
var fsx = require('fs-extra');
var zip = require('express-zip');
var moment = require('moment');
var _ = require('underscore-node');
var safeEval = require('safe-eval');
var glob = require("glob");

var rootPath = 'public/json';
var menuOptions = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
var menuFooter = 'send option';
var defaultChunkSize = 140;
var footerMoreLength = 16;
var maxMenuSize = 30;
var wizardHeader = 'a Confirm\nb Back\nYou selected:\n';
var unsureResponse = "Not sure what you meant. Please send # to see all available services.\n";
var dymHeader = "** Did you mean? **\n";

var app = express();

// Bring in the routes for the API (delete the default routes)
var routesApi = require('./app_api/routes/index.js');

// Bring in the data model & connect to db
// require('./app_api/models/db');

// The http server will listen to an appropriate port, or default to
// port 5000.
var theport = process.env.PORT || 5000;

app.use(logger('dev'));
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: '0nems1m',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 360000 } // 24 hours
}));

app.use(function(req, res, next) { //allow cross origin requests
    res.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS, DELETE, GET");
    res.header("Access-Control-Allow-Origin", "http://localhost");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

process.on('ReferenceError', function(reason, p) {
    console.log("global ReferenceError");
});

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function(req, file, cb) {
        cb(null, path.join(rootPath, req.body.destination));
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

var upload = multer({ //multer settings
    storage: storage,
    fileFilter: function(req, file, cb) {
        if (path.extname(file.originalname).toLowerCase() !== ".json") {
            return cb(new Error('File is not of type JSON'));
        }
        cb(null, true);
    }
}).fields([
    { name: "file-0" },
    { name: "file-1" },
    { name: "file-2" },
    { name: "file-3" },
    { name: "file-4" },
    { name: "file-5" },
    { name: "file-6" },
    { name: "file-7" },
    { name: "file-8" },
    { name: "file-9" },
    { name: "file-10" },
    { name: "file-11" },
    { name: "file-12" },
    { name: "file-13" },
    { name: "file-14" },
    { name: "file-15" },
    { name: "file-16" },
    { name: "file-17" },
    { name: "file-18" },
    { name: "file-19" }
]);

// Use the API routes when path starts with /api
app.use('/api', routesApi);

app.post('/files/upload', function(req, res) {
    console.log("upload");

    upload(req, res, function(err) {
        if (err) {
            console.log('Error Occured' + err);
            res.status(500).send({ result: { success: false, error: "" + err } });
        } else {
            res.status(200).send({ result: { success: true, error: null } });
        }
    });
});

app.post('/files/createFolder', function(req, res) {
    var fullPath = rootPath + req.body.newPath.toLowerCase();
    console.log("new path:" + fullPath);
    try {
        fs.mkdirSync(fullPath);
        res.json({ result: { success: true, error: null } });
    } catch (err) {
        console.log("err:" + err);
        res.json({ result: { success: false, error: err } });
    }
});


app.post('/files/edit', function(req, res) {
    var fullFile = rootPath + req.body.item;

    try {
        jsonFile = JSON.parse(req.body.content);
        file = fs.writeFileSync(fullFile, req.body.content);
        res.json({ result: { success: true, error: null } });
    } catch (err) {
        console.log("err:" + err);
        res.json({ result: { success: false, error: "error: " + err } });
    }
});

//{
//    "action": "copy",
//    "items": ["/public_html/index.php", "/public_html/config.php"],
//    "newPath": "/includes",
//    "singleFilename": "renamed.php" <-- (only present in single selection copy)
//}
app.post('/files/copy', function(req, res) {

    var result = { success: true, error: null };

    console.log("req.body");
    console.log(req.body);

    if (typeof req.body.singleFilename !== 'undefined') {

        try {
            fsx.copySync(
                path.join(rootPath, req.body.items[0].toLowerCase()),
                path.join(rootPath, req.body.newPath,
                    req.body.singleFilename.toLowerCase()));
        } catch (err) {
            console.error(err);
            result.error = "" + err;
            result.success = false;
        }
    } else if (typeof req.body.items !== 'undefined' && req.body.items.length > 0) {
        try {
            _.each(req.body.items, function(item) {
                item = item.toLowerCase();
                fsx.copySync(path.join(rootPath, item), path.join(rootPath, req.body.newPath, item));
            });
        } catch (err) {
            console.error(err);
            result.error = "" + err;
            result.success = false;
        }
    }

    if (result.success) {
        res.status(200).send({ result: result });
    } else {
        res.status(500).send({ result: result });
    }

});

app.post('/files/remove', function(req, res) {

    var result = { success: true, error: null };

    console.log(req.body);

    req.body.items.forEach(function(item) {
        var fullFile = rootPath + item;
        console.log(fullFile);
        try {
            //console.log("processing ", file);
            var stats = fs.statSync(fullFile);
            console.log(stats.size);
            if (stats.isDirectory()) {
                console.log("removing directory:" + fullFile);
                fs.rmdirSync(fullFile);
            } else if (path.extname(fullFile) === '.json') {
                console.log("unlinking file:" + fullFile);
                fs.unlinkSync(fullFile);
            }
        } catch (err) {
            console.log(err);
            result.success = false;
            result.error = err;
        }

    });

    res.json({ result: result });

});

app.post('/files/getContent', function(req, res) {

    var fullFile = rootPath + req.body.item;

    console.log(req.body);
    console.log("fullFile:" + fullFile);
    try {
        file = fs.readFileSync(fullFile, 'utf8');
        console.log("file:" + file);
        res.json({ result: file });
    } catch (err) {
        console.log("err:" + err);
        res.json({ result: { success: false, error: err } });
    }

});

app.post('/files/rename', function(req, res) {

    var oldFileName = rootPath + req.body.item;
    var newFileName = rootPath + req.body.newItemPath.toLowerCase();

    console.log(req.body);
    try {
        file = fs.renameSync(oldFileName, newFileName);
        res.json({ result: { success: true, error: null } });
    } catch (err) {
        console.log("err:" + err);
        res.json({ result: { success: false, error: err } });
    }

});

app.get('/files/download', function(req, res) {
    var fileName = path.basename(req.query.path);
    res.download(path.join(__dirname, rootPath, req.query.path));
});

app.get('/files/downloadMultiple', function(req, res) {
    var zipArray = [];
    _.each(req.query.items, function(item) {
        var fullItem = path.join(rootPath, item);
        var obj = { name: item, path: fullItem };
        zipArray.push(obj);
    });
    console.log("zipArray: ");
    console.log(zipArray);
    res.zip(zipArray, "download.zip");
});


app.get('/files/downloadAll', function(req, res) {

    var walk = function(dir, done) {
        var results = [];
        fs.readdir(dir, function(err, list) {
            if (err) return done(err);
            var i = 0;
            (function next() {
                var file = list[i++];
                if (!file) return done(null, results);
                file = dir + '/' + file;
                fs.stat(file, function(err, stat) {
                    if (stat && stat.isDirectory()) {
                        walk(file, function(err, res) {
                            results = results.concat(res);
                            next();
                        });
                    } else if (path.extname(file) === '.json') {
                        var obj = { name: file.slice(rootPath.length + 1, file.length), path: file };
                        results.push(obj);
                        next();
                    } else {
                        next();
                    }
                });
            })();
        });
    };

    walk(rootPath, function(err, results) {
        if (err) {
            res.status(500).send({ error: err });
        } else {
            console.log(results);
            res.zip(results, "download.zip");
        }
    });
});


app.post('/files/list', function(req, res) {
    var currentDir = rootPath;

    console.log("body:");
    console.log(req.body);

    var query = req.body.path || '';
    if (query) currentDir = path.join(currentDir, query);
    console.log("browsing ", currentDir);
    fs.readdir(currentDir, function(err, files) {
        if (err) {
            throw err;
        }
        var data = [];
        files
            .filter(function(file) {
                return true;
            }).forEach(function(file) {
                try {
                    //console.log("processing ", file);
                    var stats = fs.statSync(path.join(currentDir, file));
                    var size = stats.size;
                    var date = moment(stats.mtime).format('YYYY-MM-DD HH:MM:SS');
                    if (stats.isDirectory()) {
                        data.push({ name: file, type: 'dir', size: size, date: date });
                    } else if (path.extname(file) === '.json') {
                        data.push({ name: file, type: 'file', size: size, date: date });
                    }

                } catch (e) {
                    console.log(e);
                }

            });
        data = _.sortBy(data, function(f) {
            return f.Name;
        });
        res.json({ result: data });
    });
});

function didYouMean(input) {

    var result = { status: "failed", commands: [], files: [] };
    var options = {};

    if (input[0] !== '#') return result;

    var words = input.split(/\b/);

    // try first word

    var searchPath = path.join(rootPath, words[1] + '*');

    console.log("searching: ", searchPath);
    var files = glob.sync(searchPath, options);
    files.forEach(function(file) {
        console.log("file Object:");
        console.log(path.parse(file).name);
        result.commands.push('#' + path.parse(file).name + ' \n');
        result.files.push(path.join(file, '/index.json'));
    });

    if (result.commands.length === 1) {
        result.status = 'success';
    }

    if (result.commands.length > 1) {
        result.status = "partial";
    }

    console.log("returning:");
    console.log(result);

    return result;
}


function getMenuResponse(input, context) {

    var response = '';
    var desc;
    var i = context.indexPos;
    var menu = context.content[i].content;

    for (var j = 0; j < menu.length; j++) {
        desc = processVars(menu[j].description, context.variables);
        response = response + menuOptions[j] + ' ' + desc + '\n';
    }

    return response;
}

function extractAttrs(str) {
    var result = [];
    var strMatch = str.match(/{{\s*([^}]+)\s*}}/g);

    _.each(strMatch, function(matched) {
        result.push(matched);
    });

    console.log("result:");
    console.log(result);

    return result;
}


function globalEval(code, v) {
    var variables = this.variables;

    console.log("code=" + code);

    console.log("variables=");
    console.log(variables);

    return Function(code)();
}

function processVars(textStr, variables) {

    console.log("inside processVars");

    var result = textStr;
    var expression, evalRes, finalResult, secondTry;

    function makeEvalContext(declarations) {

        console.log("declarations: "+declarations);

        eval(declarations);
        return function(str) { console.log("str:"+str); eval(str); };
    }

    if (typeof textStr !== 'undefined' &&
        typeof variables !== 'undefined') {

        console.log("variables:");
        console.log(variables);

        var attrArray = extractAttrs(textStr);

        console.log("attrArray:");
        console.log(attrArray);

        var declareVars = '';

        if (attrArray.length > 0) {

            var varString = JSON.stringify(variables);
            var varsInScope = "x = " + varString + ';';

            console.log(varsInScope);

            for (j = 0; j < variables.length; j++) {
                declareVars = declareVars + 'var ' + variables[j].name + "=x[" + j + "].value;\n";
            }

            console.log("declareVars:"+declareVars);

            eval1 = makeEvalContext("var x;");
            eval2 = makeEvalContext(varsInScope);
            eval3 = makeEvalContext(declareVars);

            // now all the attribute names should be replaced with their values
            // we can loop through attributes again and evaluate the expression, and remove {{ }}

            attrArray = extractAttrs(result);

            //make a string to declare all variables

            var code = '';

            _.each(attrArray, function(attr) {

                expression = "evalRes = " + attr.slice(2, attr.length - 2); // remove {{ }}

                // code = '{' + declareVars + "return " + expression + ';}';

                console.log("code to evaluate:" + expression);

                // var context = {expression: expression, variables: variables};

                try {

                    eval3(expression);

                    console.log("evaluating: secondTry=" + evalRes);

                //    eval3("secondTry = " + evalRes);

                    console.log("secondTry:"+ secondTry);

                    // evalRes = evalInContext.call(code);

                    // evalRes = globalEval(code, variables);

                    console.log("evalRes:" + evalRes);
                } catch (e) {
                    console.log("safely catch the error" + e);
                }

                if (typeof evalRes === 'undefined') {
                    result = result.replace(attr, 'undefined');
           //     } else if (typeof secondTry !== 'undefined' ) {
           //         result = result.replace(attr, secondTry);
                } else {
                    result = result.replace(attr, evalRes);
                }
                
 
                //   evalRes = evalRes.trim();

            });
        }
    }

    console.log("result:" + result);

    return result;
}

function getWizardResponse(input, context) {

    var response = wizardHeader;
    var desc;
    var i = context.indexPos;

    var menu = context.content[i].content;

    for (var i = 0; i < menu.length; i++) {
        desc = processVars(menu[i].description, context.variables);
        response = response + menuOptions[i + 2] + ' ' + desc + '\n';
    }

    console.log("inside wizard returning:" + response);

    return response;
}

// returns
// {
//    success : true || false,
//    data : context
//    response : error text
// }
function serviceSwitch(input, oldContext) {

    var fileName = '';
    var fullPath = '';
    var response = '';
    var context = { success: false, data: null, response: '' };
    var file;

    var fileExtended = input.replace(/ /g, '/'); // eg convert #post add to #post/add

    console.log("fileExtended:" + fileExtended);

    if (input[0] === '#') {

        if (input.indexOf(' ') === -1) { // if string does not have a space somewhere in the middle (it's been trimmed already)
            fileName = '/' + input.slice(1).toLowerCase() + '/index.json'; // #convert #post to /post/index.json
        } else {
            switch (input) {
                case '#': // if input string is exactly '#', then it's the main index
                    fileName = 'index.json';
                    break;
                case '#onem':
                    fileName = 'onem.json';
                    break;
                default:
                    fileName = fileExtended.slice(1).toLowerCase() + '.json'; // remove '#'
                    break;
            }
        }
    } else {
        fileName = input;
    }

    fullPath = path.join(rootPath, fileName);

    console.log("fullPath:" + fullPath);

    var dymRes = {};

    context.success = false;

    try {
        file = fs.readFileSync(fullPath, 'utf8');
        context.success = true;
    } catch (err) {

        dymRes = didYouMean(input);

        if (dymRes.status === "success") {
            try {
                file = fs.readFileSync(dymRes.files[0], 'utf8');
                context.success = true;
            } catch (e) {
                console.log(e);
            }
        } else if (dymRes.status === "partial") {
            context.response = dymHeader;
            _.each(dymRes.commands, function(command) {
                context.response = context.response + command;
            });
            context.success = false;
        } else {
            context.response = unsureResponse;
        }

    }

    if (context.success) {
        try {
            var index = JSON.parse(file);
            if (typeof index !== 'undefined') {
                context.success = true;
                context.data = JSON.parse(JSON.stringify(index));
                context.data.indexPos = 0;
                context.data.chunkSize = oldContext.chunkSize;
                context.data.variables = [];
                //copy global vars to new context
                if (typeof oldContext.variables !== 'undefined') {
                    _.each(oldContext.variables, function(variable) {
                        if (variable.name[0] == '$') {
                            context.data.variables.push(variable);
                        }
                    });
                    //     context.data.variables = JSON.parse(JSON.stringify(oldContext.variables));
                }

            } else {
                console.log("invalid json 1");
                context.response = "Invalid JSON detected: " + fileName;
                context.success = false;
            }
        } catch (err) {
            console.log("error:" + err);
            console.log("invalid json 2");
            context.response = "Invalid JSON detected: " + fileName;
            context.success = false;
        }
    }

    return context;

}

function processMenuContext(option, context) {

    var i = context.indexPos;
    var result = { success: false, data: { indexPos: 0 } };
    var switchRes;
    var selected = context.content[i].content[option];

    console.log("option:" + option);
    console.log("inside processMenuRequest, context.content[i].content[option]:");
    console.log(selected);

    switch (selected.type) {
        case 'linkStatic':
        case 'linkDynamic':
            console.log(selected.ref);
            switchRes = serviceSwitch(selected.ref, context);
            console.log("switchRes");
            console.log(switchRes);

            if (switchRes.success) {
                result.data = JSON.parse(JSON.stringify(switchRes.data));
                result.data.indexPos = 0;
                result.success = true;
                console.log("result");
                console.log(result);
            } else {
                result.response = switchRes.response;
            }
            break;
        case 'skip':
            console.log("skipping");
            context.indexPos++;
            context.chunks = [];
            result.data = context;
            console.log("index:" + result.data.indexPos);
            result.success = true;
            break;
        default:
            break;
    }

    return result;

}

function getType(context) {

    var i = context.indexPos;
    var type;

    console.log("processRequest");
    console.log(context);

    if (context.content instanceof Array) {
        console.log("content is a array");
        type = context.content[i].type;
    } else {
        console.log("content is not an array");
        type = context.content.type;
    }

    return type.toLowerCase();

}


// main handler for responses 
// returns {response : main body of text without header or footer
//          skip: tells main logic whether to skip to the next json item, ie not wait for a response from the user}

function processRequest(input, context) {

    var result = { response: '', skip: false, newContext: false, context: null };
    var i = context.indexPos;
    var type = '';

    console.log("processRequest");
    console.log(context);

    type = getType(context);

    switch (type) {
        case 'menu':
            result.response = getMenuResponse(input, context);
            break;
        case 'input':
            console.log("type input:");
            console.log(context.content[i].content.description);
            result.response = context.content[i].content.description + '\n';
            break;
        case 'wizard':
            console.log("processRequest, type wizard");
            result.response = getWizardResponse(input, context);
            break;
        case 'message':
            console.log("type message");
            checkForVar(context, context.content[i], input);
            result.response = processVars(context.content[i].description, context.variables) + '\n';
            result.skip = true;
            break;
        case 'end':
            console.log("end found");
            console.log(context.content[i].ref);
            result = serviceSwitch(context.content[i].ref, context);
            console.log("result");
            console.log(result);

            if (result.success) {
                var newContext = JSON.parse(JSON.stringify(result.data));
                var newResult = processRequest(input, newContext);
                result.context = JSON.parse(JSON.stringify(result.data));
                result.newContext = true;
                result.response = newResult.response;
            }
            break;
        default:
            break;
    }

    return result;

}

function getMenuOption(context, input, menuContent) {

    var response = { success: false, response: 'invalid menu option', menuOption: false, selectedOption: null };
    // if it's only 1 char long and in range of a to last menu option
    response.selectedOption = menuOptions.indexOf(input);
    console.log("selectedOption:" + response.selectedOption);
    response.firstOption = 'a';
    response.lastOption = menuOptions[menuContent.length - 1];
    if (response.selectedOption !== -1 &&
        response.selectedOption <= menuContent.length - 1) {
        response.success = true;
        response.menuOption = true;
        checkForVar(context, menuContent[response.selectedOption], input);
    } else {
        // not a-z, so check shortcuts
        for (var i = 0; i < menuContent.length; i++) {
            if (typeof menuContent[i].shortcut !== 'undefined' && input === menuContent[i].shortcut.toLowerCase()) {
                response.selectedOption = i;
                response.success = true;
                response.menuOption = true;
                checkForVar(context, menuContent[i], input);
                break;
            }
        }
    }

    return response;
}

function checkForVar(context, content, input) {

    console.log("inside checkForVar, content:");
    console.log(content);

    if (typeof content.var !== 'undefined') {
        if (typeof context.variables === 'undefined') {
            context.variables = [];
        }

        var varObj;

        if (!content.var.includes("=")) {
            varObj = { "name": content.var, "value": input };
        } else {
            var splitString = content.var.split('=');
            var stringValue = splitString[1].trim();
            console.log("stringValue:" + stringValue);
            varObj = { "name": splitString[0].trim(), "value": stringValue };
        }

        console.log("varObj:");
        console.log(varObj);

        //need to overwrite variable if it already exists

        var found = false;

        _.each(context.variables, function(variable) {
            if (variable.name === varObj.name) {
                console.log("overwriting");
                variable.name = varObj.name; // already exists so overwrite
                variable.value = varObj.value;
                found = true;
            }
        });
        if (!found) context.variables.push(varObj);

        console.log("detected var, variables:");
        console.log(context.variables);
    }
}

function validateInput(moText, context) {

    var input = moText.toLowerCase();
    var response = { success: true, menuOption: false };
    var i = context.indexPos;
    var type = '';
    var found;

    if (context.content instanceof Array) {
        console.log("content is a array");
        type = context.content[i].type;
    } else {
        console.log("content is not an array");
        type = context.content.type;
    }

    console.log("validating input:" + moText);
    console.log("type:" + type);
    console.log("index:" + i);

    switch (type) {
        case 'menu':
            var menuContent = context.content[i].content;

            console.log("menuContent:");
            console.log(menuContent);
            console.log("input:" + input);

            response = getMenuOption(context, input, menuContent);
            break;
        case 'input':
            console.log('input found');
            response.success = true;
            checkForVar(context, context.content[i].content, input);

            break;
        case 'wizard':
            var wizardContent = context.content[i].content;
            console.log("wizardContent:");
            console.log(wizardContent);

            found = menuOptions.indexOf(input[0]);
            console.log("found:" + found);
            if (input.length === 1 &&
                found !== -1 &&
                found <= wizardContent.length + 1) { // wizards have two extra options a) confirm and b) back
                response.success = true;
                response.firstOption = 'a';
                response.lastOption = menuOptions[wizardContent.length + 1];
            } else {
                response.success = false;
                response.response = "invalid menu option";
            }
            break;
        case 'message':
            console.log("message type");
            response.success = true;
            checkForVar(context, context.content[i], input);

            break;
        default:
            break;

    }

    return response;
}

function makeLogContent(context) {
    var i = context.indexPos;
    var type = context.content[i].type;
    var ref = context.content[0].ref;
    var content = context.content[i];

    var logText = "Index: " + i + " Type: \'" + type + "\' ref: " + ref + "\nContent: " + JSON.stringify(content);
    return logText;
}

function processComment(content) {
    var comment;

    console.log("inside comment content:");
    console.log(content);

    if (typeof content.comment !== 'undefined') {
        comment = content.comment + '\n';
    }
    return comment;
}

function processHeader(content, context) {
    var header = '';

    console.log("inside header content:");
    console.log(content);

    if (typeof content.header !== 'undefined') {
        header = processVars(content.header, context.variables) + '\n';
    }
    return header;
}

function processFooter(content, context) {

    var footerText;

    if (content.type === 'message') {
        footerText = '';
    } else if (typeof content.footer !== 'undefined') {
        footerText = '<' + processVars(content.footer, context.variables) + '>';
    } else {
        footerText = '<' + menuFooter + '>';
    }

    return footerText;
}

function storeChunks(context, header, footer, body) {

    var combined = header + body;
    var realChunkSize = context.chunkSize - footerMoreLength;
    var type;
    var i = context.indexPos;
    var result;

    context.chunks = [];

    var makeChunks = function(rawText) {
        var combinedWords = rawText.split(/\b/);
        var result = [];
        var chunk = '';

        console.log("realChunkSize:" + realChunkSize);

        for (var j = 0; j < combinedWords.length; j++) {

            if (chunk.length + combinedWords[j].length < realChunkSize) {
                chunk = chunk + combinedWords[j];
            } else {
                result.push(chunk.trim());
                chunk = '';
                j--;
            }
        }
        // push the last chunk that was less than the realChunkSize
        if (chunk.length > 0) {
            result.push(chunk.trim());
        }

        return result;

    };


    type = getType(context);

    if (type !== 'menu' && type !== 'wizard') {

        context.chunks = makeChunks(combined);

        // add footers
        for (var j = 0; j < context.chunks.length; j++) {
            context.chunks[j] = context.chunks[j] + '\n<"more" ' + (j + 1) + '/' + context.chunks.length + '>';
        }

    } else {

        // it's a menu or wizard, first truncate any lengths > 30 chars

        var menuItems = [];
        var menuText = '';
        var index;
        var desc;

        if (type === 'wizard') {
            menuItems.push(wizardHeader);
            index = 2;
        } else {
            index = 0;
        }

        for (var j = 0; j < context.content[i].content.length; j++) {

            desc = processVars(context.content[i].content[j].description, context.variables);

            console.log("desc:" + desc);

            if (desc.length > maxMenuSize && maxMenuSize > 4) {
                menuText = menuOptions[j + index] + ' ' + desc.slice(0, maxMenuSize - 4) + "...\n";
            } else {
                menuText = menuOptions[j + index] + ' ' + desc + '\n';
            }
            menuItems.push(menuText);
        }

        // start making the chunks, starting with the header, then we can start adding menu items
        var chunkedHeader = makeChunks(header);

        // make another chunk to make room for menu items because this one is full
        if (chunkedHeader[chunkedHeader.length - 1] >= realChunkSize && menuItems.length > 0) {
            chunkedHeader.push(' ');
        }

        context.chunks = chunkedHeader; // copy all header chunks

        lastChunk = context.chunks.pop() + '\n'; // remove the last chunk from the list and save it

        //now we can start adding menu items
        for (var j = 0; j < menuItems.length; j++) {
            if (lastChunk.length + menuItems[j].length < realChunkSize) {
                lastChunk = lastChunk + menuItems[j];
            } else {
                context.chunks.push(lastChunk.trim());
                lastChunk = '';
                j--;
            }
        }
        // push the last chunk that was less than the realChunkSize
        if (lastChunk.length > 0) {
            context.chunks.push(lastChunk.trim());
        }

        //now insert footers
        for (var j = 0; j < context.chunks.length; j++) {
            context.chunks[j] = context.chunks[j] + '\n<"more" ' + (j + 1) + '/' + context.chunks.length + '>';
        }

    }
    console.log("context.chunks:");
    console.log(context.chunks);

    if (context.chunks.length === 1) {
        //after all that, there is only one chunk, so set chunks back to zero and return the result
        console.log("resetting");
        result = context.chunks[0].slice(0, context.chunks[0].length - 11);
        result = result + footer;
        context.currentChunkPage = 0;
        context.chunks = [];

    } else {

        result = context.chunks[0];
        context.currentChunkPage = 1;
    }

    return result;

}

app.get('/api/getResponse', function(req, res, next) {

    var moText = (typeof req.query.moText !== 'undefined') ? req.query.moText.trim() : 'skip';
    var skip = req.query.skip;
    var response = '';
    var header = '';
    var footer = '';
    var comment;
    var firstChar = '';
    var firstTime = false;
    var serviceSwitched = false;
    var verb = false;
    var status = { success: true, chunking: false };
    var i;
    var body = { response: '', skip: false }; // container for processRequest


    if (moText.length === 0) return res.json({ mtText: undefined });

    if (typeof req.session.onemContext === 'undefined') { // must be first time, or expired
        req.session.onemContext = { fileName: 'onem.json' };
        req.session.onemContext.indexPos = 0;
        req.session.onemContext.chunkSize = defaultChunkSize;
        moText = "#onem";
        firstTime = true;
    }

    if (typeof skip !== 'undefined') console.log("skip constructor:" + skip.constructor);

    i = req.session.onemContext.indexPos;

    firstChar = moText[0].toLowerCase();

    console.log("moText sliced:" + moText.toLowerCase().slice(0, 4));

    // check MO request for reserved verbs or service switching
    switch (true) {
        case (skip === 'true'):
            console.log("skip redirect found");
            break;
        case (firstChar == '#'):
            var result = serviceSwitch(moText, req.session.onemContext);
            if (result.success) {
                verb = true;
                serviceSwitched = true;
                req.session.onemContext = result.data;
                req.session.onemContext.indexPos = 0;
                i = 0;
            } else {
                status.success = false;
                status.response = result.response;
            }
            break;
        case (moText.toLowerCase().slice(0, 4) === 'size'):
            var newChunkSize = parseInt(moText.slice(4, moText.length));
            req.session.onemContext.chunkSize = newChunkSize * defaultChunkSize;
            if (newChunkSize >= 1 && newChunkSize <= 5) {
                status.response = "Message Length is now " + 140 * newChunkSize;
            } else {
                status.response = "Size must be in range of 1 to 5";
            }
            verb = true;
            status.success = false;
            break;
        case (moText.toLowerCase() === 'menu'):
            var menuRef = req.session.onemContext.content[i].menuRef;
            if (typeof menuRef !== 'undefined') {
                var result = serviceSwitch(menuRef, req.session.onemContext);
                if (result.success) {
                    verb = true;
                    serviceSwitched = true;
                    req.session.onemContext = result.data;
                    req.session.onemContext.indexPos = 0;
                    i = 0;
                } else {
                    status.success = false;
                    status.response = result.response;
                }
            } else {
                status.success = false;
                status.response = "Send a valid option";
            }
            break;
        case (moText.toLowerCase() === 'back'):
            if (req.session.onemContext.indexPos === 0) {
                moText = 'menu';
            } else {
                req.session.onemContext.indexPos--;
                i = req.session.onemContext.indexPos;
                console.log("decrementing index, now:" + i);
            }
            verb = true;
            break;
        case (moText.toLowerCase() === 'more'):
            if (typeof req.session.onemContext.chunks !== 'undefined' &&
                req.session.onemContext.chunks.length > 0) {

                if (req.session.onemContext.currentChunkPage >= req.session.onemContext.chunks.length) {
                    // wrap around to first page
                    req.session.onemContext.currentChunkPage = 1;
                    status.response = req.session.onemContext.chunks[0];

                } else {
                    var currentChunkPage = req.session.onemContext.currentChunkPage;
                    status.response = req.session.onemContext.chunks[currentChunkPage];
                    req.session.onemContext.currentChunkPage++;

                }

                status.success = false;
                status.chunking = true;
            } else {
                status.response = "No chunks available";
                status.success = false;
            }
            break;
        default:
            break;
    }

    // if it's not a reserved word, then validate the input against the savedContext
    // eg if it's a menu option, check the selected option value
    // if it's an input string, then accept anything else (other than a reserved verb)
    if (!verb && !firstTime && status.success) {
        status = validateInput(moText, req.session.onemContext);
        console.log("after validated input, status:");
        console.log(status);
    }

    if (status.success && status.menuOption) {

        var result = {};

        // step into menu

        i = req.session.onemContext.indexPos;
        result = processMenuContext(status.selectedOption, req.session.onemContext);
        if (result.success) {
            console.log("result is success");
            req.session.onemContext = JSON.parse(JSON.stringify(result.data));
            body = processRequest(moText, req.session.onemContext);
            i = req.session.onemContext.indexPos;
            header = processHeader(req.session.onemContext.content[i], req.session.onemContext);
            footer = processFooter(req.session.onemContext.content[i], req.session.onemContext);
            comment = processComment(req.session.onemContext.content[i]);
        } else {
            console.log("result is fail");
            body.response = result.response;
        }
        //        req.session.onemContext = processMenuContext(moText, req.session.onemContext);

        console.log("after processmenu, index:" + req.session.onemContext.indexPos + ' i:' + i);

        console.log("content:");
        console.log(req.session.onemContext.content[i]);


    } else if (status.success) {

        if (!firstTime && !serviceSwitched && !verb) {
            req.session.onemContext.indexPos++;
            req.session.onemContext.chunks = [];
            console.log("incrementing index, now:" + i);
        }

        console.log("before processRequest, not a menu option, i:" + i);

        body = processRequest(moText, req.session.onemContext);

        if (body.newContext) {
            req.session.onemContext = JSON.parse(JSON.stringify(body.context));
        }

        i = req.session.onemContext.indexPos;

        console.log("after processRequest, not a menu option, i:" + i);

        header = processHeader(req.session.onemContext.content[i], req.session.onemContext);
        footer = processFooter(req.session.onemContext.content[i], req.session.onemContext);
        comment = processComment(req.session.onemContext.content[i]);

    } else {
        body.response = status.response;
    }

    var finalResponse = '';

    if (status.chunking) {

        finalResponse = status.response;

    } else {

        req.session.onemContext.chunks = [];

        finalResponse = header + body.response + footer;

        console.log("chunksize:" + req.session.onemContext.chunkSize);

        if (finalResponse.length > req.session.onemContext.chunkSize) {
            console.log("response > chunkSize");
            finalResponse = storeChunks(req.session.onemContext, header, footer, body.response);
        }
    }

    var log = makeLogContent(req.session.onemContext);

    res.json({
        mtText: finalResponse,
        skip: body.skip,
        comment: comment,
        log: log
    });


});

app.get('/', function(req, res, next) {
    res.sendFile('/public/views/index.html', { root: __dirname });
});

app.get('*', function(req, res) {
    res.sendFile('/public/views/index.html', { root: __dirname });
});

app.get('/*', function(req, res, next) {
    console.log("caught default route");
    // Just send the index.html for other files to support HTML5Mode
    res.sendFile('/public/views/index.html', { root: __dirname });
});

// error handling middleware should be loaded after the loading the routes
if ('development' == app.get('env')) {
    app.use(errorHandler());
}

var server = http.createServer(app);
server.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
server.listen(5000);

module.exports = app;