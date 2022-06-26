'use strict';

/*** CONFIG ***/

const {mysql: config} = require('./config');

/*** ***/

const mysql = require('mysql');

/*** POOL ***/

const pool = mysql.createPool(config);

/*** EXPORTS ***/

module.exports = {mysql, pool};
