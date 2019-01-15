const debug = require('debug')('onem-zone');

var mongoose = require('mongoose');
var gracefulShutdown;

// Here we find an appropriate database to connect to, defaulting to
// localhost if we don't find one.
var dbURI = process.env.MONGODB_URI ||  'mongodb://127.0.0.1:27017/onem-zone';

debug("dbURI:"+dbURI);

mongoose.connect(dbURI, { 
    useNewUrlParser: true,
    useCreateIndex: true
 }, function (err, res) {
  if (err) { 
    debug ('ERROR connecting to: ' + dbURI + '. ' + err);
  } else {
    debug ('Succeeded connected to: ' + dbURI);
  }
});

// CAPTURE APP TERMINATION / RESTART EVENTS
// To be called when process is restarted or terminated
gracefulShutdown = function(msg, callback) {
    mongoose.connection.close(function() {
        debug('Mongoose disconnected through ' + msg);
        callback();
    });
};
// For nodemon restarts
process.once('SIGUSR2', function() {
    gracefulShutdown('nodemon restart', function() {
        process.kill(process.pid, 'SIGUSR2');
    });
});
// For app termination
process.on('SIGINT', function() {
    gracefulShutdown('app termination', function() {
        process.exit(0);
    });
});
// For Heroku app termination
process.on('SIGTERM', function() {
    gracefulShutdown('Heroku app termination', function() {
        process.exit(0);
    });
});
