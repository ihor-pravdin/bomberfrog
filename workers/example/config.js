'use strict';

const config = require('../../config');

config.mysql.connectionLimit = 5;

module.exports = config;