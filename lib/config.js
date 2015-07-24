'use strict';

var _ = require('lodash');

// default config
var default_config = {
  server: {
    port: 40000
  },
  proxy: {}
};

function config (user_options) {
  if (typeof user_options !== 'object') user_options = {};

  return _.assign({}, default_config, user_options);
}

module.exports = config;
