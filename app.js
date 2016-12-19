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
app.use(multer());

// Use the API routes when path starts with /api
app.use('/api', routesApi);

app.use(express.static(path.join(__dirname, 'public')));

var index = JSON.parse(fs.readFileSync('./app_api/json/index.json', 'utf8'));
console.log("index.content.length:"+index.content.length);

app.get('/api/getResponse', function(req, res) {

	var response = '';
	
	if (typeof index.content[0].header !== 'undefined') {
		response = response + index.content[0].header + '\n';
	}

	switch (index.content[0].type) {
		case 'menu':
			var menuContent = index.content[0].content;
			for (var i=0; i<menuContent.length; i++) {
				response = response + menuContent[i].description + '\n';
			}
			break;
		default:
			break;
	}

    res.json({ mtText: response });
});


app.get('/', function(req, res, next) {
    res.sendFile('/public/views/index.html', { root: __dirname });
});

app.get('*', function (req, res) {
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

module.exports = app;