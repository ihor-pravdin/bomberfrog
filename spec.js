'use strict'

const {body, param, validationResult} = require('express-validator');

const Err = require('./error');

const {status} = require('./constants');

/*** EXPORTS ***/

module.exports = {

    // VALIDATION RULES

    limit: param('limit').default(50).isInt({min: 1, max: 100}).toInt(),
    offset: param('offset').default(0).isInt({min: 0}).toInt(),
    name: param('name').isUUID('4'),
    status: body('status').isInt().toInt().isIn(Object.values(status)),

    // VALIDATION MIDDLEWARE

    validate: (req, res, next) => {
        const {errors} = validationResult(req);
        if (errors.length > 0) {
            return next(new Err(Err.REQUEST_VALIDATION_FAILED, {description: errors}));
        }
        return next(null, req, res, next);
    }
};
