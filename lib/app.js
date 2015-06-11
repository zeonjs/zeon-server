// Require
//
// ======================================================================
var path         = require('path');
var express      = require('express');
var logger       = require('morgan');
var bodyParser   = require('body-parser');
var cookieParser = require('cookie-parser');
// var favicon      = require('serve-favicon');


var app = express();

// Express setting
//
// ======================================================================
// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev', {
  skip: function (req, res) { return res.statusCode < 400 }
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());



module.exports = app;
