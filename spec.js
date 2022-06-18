'use strict'

const {body, param, validationResult} = require('express-validator');

const Err = require('./error');

const constant = require('./constants');

/*** EXPORTS ***/

module.exports = {

    // VALIDATION RULES

    limit: param('limit').default(50).isInt({min: 1, max: 100}).toInt(),
    offset: param('offset').default(0).isInt({min: 0}).toInt(),
    name: param('name').isUUID('4'),
    status: body('status').isInt().toInt().isIn(Object.values(constant.status)),
    worker: body('worker').isIn(constant.workers),
    workers: body('workers').default(1).isInt({min: 1}).toInt(),
    delay: body('delay').default(0).isInt({min: 0}).toInt(),
    description: body('description').default(null).isLength({ max: 128 }),

    // VALIDATION MIDDLEWARE

    validate: (req, res, next) => {
        const {errors} = validationResult(req);
        if (errors.length > 0) {
            return next(new Err(Err.REQUEST_VALIDATION_FAILED, {description: errors}));
        }
        return next(null, req, res, next);
    }
};
