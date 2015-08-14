'use strict';

var fs      = require('fs');
var path    = require('path');
var http    = require('http');
var chalk   = require('chalk');

var app     = require('./app');

function cockpit (pilot) {
  // var regIsAsync = /^\s*function\s*\((\s*\S+\s*,*\s*)*?(callback|next)\s*\)/ig;
  // var regIsAsync = /^(%20)*function(%20)*\(((%20)*\S+(%20)*(%2C)*(%20)*)*?(callback|next)(%20)*\)/ig;
  // var strFunc = pilot.toString();
  if (false) {
    // async
    return function (req, res, next) {
      pilot(req._parsedUrl.pathname, (function (req, res, next) {
        return function (content) {
          if(content) { res.send(content);}
          else { next();}
        };
      })(req, res, next));
    }
  } else {
    // sync
    return function (req, res, next) {
      var content = pilot(req._parsedUrl.pathname);

      if(content) {
        if (path.isAbsolute(content) && fs.existsSync(content)) {
          res.sendFile(content);
        } else {
          res.send(content);
        }
      }
      else { next();}
    };
  }
}

exports = module.exports = function (args) {
  var baseDir = this.base_dir; // base dir
  var config  = require('./config')(this.user_option); // config
  var port    = args.p || args.port || config.server.port; // server port


  var server = http.createServer(app);

  var nodeModule = false;

  // config MS
  if (config.MS) {
    var namespace = 'zeon-' + config.MS.toLowerCase();
    nodeModule = require(namespace);

    if (nodeModule.server && typeof nodeModule.server === 'function') {
      var pilot = nodeModule.server.call(this, config);
      app.use(cockpit(pilot));
    }
  }

  // static setting
  require('./static').call(this, app, config, nodeModule);

  // proxy setting
  require('./proxy').call(this, app, config);

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
  });

};
