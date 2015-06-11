'use strict';

var fs      = require('fs');
var path    = require('path');
var http    = require('http');
var chalk   = require('chalk');

var _config = require('./config');
var app     = require('./app');

exports = module.exports = function (args) {
  var baseDir = this.base_dir; // base dir
  var config  = this.user_option || _config; // config
  var port    = args.p || args.port || config.server.port || _config.server.port; // server port


  var server = http.createServer(app);

  // Listen on provided port, on all network interfaces.
  server.listen(port, function () {
    console.log(chalk.green('> Server at http://127.0.0.1:%s, press [CTRL+C] to stop server.'), port);
  });
  // Event listener for HTTP server "error" event.
  server.on('error', function (error) {
    if (error.syscall !== 'listen') {
      throw error;
    }

    var bind = typeof port === 'string'
      ? 'Pipe ' + port
      : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        console.error(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.error(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  });
  // Event listener for HTTP server "listening" event.
  server.on('listening', function () {
    var addr = server.address();
    var bind = typeof addr === 'string'
      ? 'pipe ' + addr
      : 'port ' + addr.port;
    // debug('Listening on ' + bind);
  });

  // var server = app.listen(port, function () {
  //   app.use(express.static(baseDir));

  //   // var port = server.address().port;
  //   var host = server.address().address;
  //   host = (host == '::') ? '127.0.0.1' : host;


  //   console.log(chalk.green('> Server at http://%s:%s, press [CTRL+C] to stop server.'), host, port);
  // });
};
