'use strict';

var path    = require('path');
var express = require('express');

exports = module.exports = function (app) {
  var baseDir = this.base_dir; // base dir
  var config  = this.user_option; // config

  if (!config || !config.dir || !config.dir.static) {
    // no config content
    app.use(express.static(baseDir));
  }
  else {
    // has config
    var staticDir = config.dir.static;

    if (staticDir instanceof String) {
      // String
      app.use(express.static(path.join(baseDir, staticDir)));
    }

    else if (staticDir instanceof Array) {
      // Array
      for (var dir in staticDir) {
        app.use(express.static(path.join(baseDir, dir)));
      }
    }

    else if (staticDir instanceof Object) {
      // Object
      for (var dir in staticDir) {
        app.use(staticDir[dir], express.static(path.join(baseDir, dir)));
      }
    }
  }

}
