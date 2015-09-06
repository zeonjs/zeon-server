'use strict';

var http = require('http');
var https = require('https');
var fs = require('fs');
var multiparty = require('multiparty');
var request = require('request');

var httpOrhttps = null;
var config = null;

function requestOptions(req) {
    var prefix = config.proxy.prefix;
    prefix = !!prefix ? (prefix === '/' ? '' : prefix) : '';

    var opt = {
        method: req.method,
        host: config.proxy.host,
        port: config.proxy.port,
        path: prefix + req.originalUrl
    };

    if (!!config.proxy.https) {
        opt.rejectUnauthorized = false;
    }

    return opt;
}

function api(req, res, next) {
    var data = req.body || {};

    data = JSON.stringify(data);

    var request_contentType = req.headers['content-type'] || '';

    var opt = requestOptions(req, data);
    // opt.headers = req.headers || {};
    // opt.headers['Content-Type'] = 'application/json; charset=UTF-8';
    // opt.headers['Content-Length'] = Buffer.byteLength(data, 'utf-8');
    // opt.headers['Cookie'] = req.headers.cookie;
    // console.log(opt)
    opt.headers = {
        "Content-Type": request_contentType,
        "Content-Length": Buffer.byteLength(data, 'utf-8'),
        "Cookie": req.headers.cookie || '',
        "deviceType": 'web',
        "deviceId": 1
    };

    // file upload
    if (request_contentType.toLowerCase().indexOf('multipart/') >= 0) {
      var form = new multiparty.Form();
      var upload_url = (!!config.proxy.https ? 'https://' : 'http://') + opt.host + ':' + opt.port + opt.path;
      console.log(upload_url);

      var j = request.jar();
      var cookie = request.cookie(req.headers.cookie || '');
      j.setCookie(cookie, upload_url);

      form.parse(req, function(err, fields, files) {
          var total = 0, responseObj = {};
          for (var o in files) {
              request.post({
                  url: upload_url,
                  formData: {
                      file: fs.createReadStream(files[o][0].path, {
                          bufferSize: 4 * 1024
                      })
                  },
                  jar: j
              }, function(err, httpResponse, body) {
                  if (err) {
                      return console.error('upload failed:', err);
                  }
                  responseObj[o] = JSON.parse(body).AbsoluteUrl;
                  total--;
                  if (total === 0) {
                      res.header('Content-Type', 'text/plain');
                      res.send(body, 200);
                  }
              });
              total++;
          }
      });
    } else {
      var req = httpOrhttps.request(opt, function(serverFeedback) {
          var bufferHelper = new BufferHelper();
          serverFeedback.on('data', function(chunk) {
              bufferHelper.concat(chunk);
          }).on('end', function() {
              var contentType = serverFeedback.headers['content-type'];

              //去除cookie里的path、domain
              var setCookies = serverFeedback.headers['set-cookie'];
              if (setCookies && setCookies.length) {
                  for (var i = 0, len = setCookies.length; i < len; i++) {
                      setCookies[i] = setCookies[i].replace(/path=[^;]*;/ig, 'Path=/;').replace(/domain=[^;]*;/ig, '').replace(/\s*secure$/i, '');
                  }
              }
              res.writeHead(serverFeedback.statusCode, serverFeedback.headers);

              // is image
              var isImage = contentType && contentType.indexOf && contentType.indexOf('image') > -1;
              if (isImage) {
                  res.write(bufferHelper.toBuffer());
              } else {
                  var content = bufferHelper.toBuffer().toString();

                  res.write(content);
              }
              res.end();
          });
      });
      req.write(data + "\n");
      req.end();
    }

};

exports = module.exports = function (app, options) {
  var baseDir = this.base_dir; // base dir
  config = options;
  httpOrhttps = !!config.proxy.https ? https : http;

  app.use(api);
}



// ----- BufferHelper -------------------------------------------------------------------------------------------


var BufferHelper = function () {
  this.buffers = [];
  this.size = 0;
  this._status = "changed";
};

BufferHelper.prototype.concat = function (buffer) {
  for (var i = 0, l = arguments.length; i < l; i++) {
    this._concat(arguments[i]);
  }
  return this;
};

BufferHelper.prototype._concat = function (buffer) {
  this.buffers.push(buffer);
  this.size = this.size + buffer.length;
  this._status = "changed";
  return this;
};

BufferHelper.prototype._toBuffer = function () {
  var data = null;
  var buffers = this.buffers;
  switch(buffers.length) {
    case 0:
      data = new Buffer(0);
      break;
    case 1:
      data = buffers[0];
      break;
    default:
      data = new Buffer(this.size);
      for (var i = 0, pos = 0, l = buffers.length; i < l; i++) {
        var buffer = buffers[i];
        buffer.copy(data, pos);
        pos += buffer.length;
      }
      break;
  }
  // Cache the computed result
  this._status = "computed";
  this.buffer = data;
  return data;
};

BufferHelper.prototype.toBuffer = function () {
  return this._status === "computed" ? this.buffer : this._toBuffer();
};

BufferHelper.prototype.toString = function () {
  return Buffer.prototype.toString.apply(this.toBuffer(), arguments);
};
