'use strict'

const {body, param} = require('express-validator');

const {status} = require('./constants');

/*** EXPORTS ***/

module.exports = {
    limit: param('limit').default(50).isInt({min: 1, max: 100}).toInt(),
    offset: param('offset').default(0).isInt({min: 0}).toInt(),
    name: param('name').isUUID('4'),
    status: body('status').isInt().toInt().isIn(Object.values(status))
};
