'use strict'

const express = require('express');
const app = express();
const router = express.Router();
const {validationResult} = require('express-validator');

require('express-async-errors');

/*** CONSTANTS ***/

const {LIST_STATUS_CHANGED} = require('./constants/event');

/*** SPEC ***/

const spec = require('./spec');

/*** ACTIONS ***/

const action = require('./actions');

/*** EVENTS EMITTER ***/

const emitter = require('./events');

/*** MIDDLEWARE ***/

const validationWrapper = fn => (req, res, next) => {
    const {errors} = validationResult(req);
    if (errors.length > 0) {
        return res.status(400).json({error: errors});
    }
    const result = fn(req, res, next);
    return Promise.resolve(result).catch(next);
};

/*** HANDLERS ***/

const getLists = validationWrapper(async ({params: {limit, offset}}, res) => {
    const result = await action.getLists(limit, offset);
    res.json(result);
});

const getListByName = validationWrapper(async ({params: {name}}, res) => {
    const result = await action.getListByName(name);
    res.json(result);
});

const runListProcessing = validationWrapper(async ({params: {name}}, res) => {
    const result = await action.setProcessingListStatus(name);
    emitter.emit(LIST_STATUS_CHANGED, result);
    res.json(result);
});

const notFound = (req, res) => {
    res.status(404).json({error: 'Not found'})
};

const exceptionHandler = (err, req, res, next) => {
    console.log(err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({error: err.message || 'Unknown error'});
};

/*** ROUTES ***/

app.use(express.json());

router
    .route('/lists/:limit?/:offset?')
    .get(spec.limit, spec.offset, getLists);

router
    .route('/list/:name')
    .get(spec.name, getListByName);

router
    .route('/run/:name')
    .post(spec.name, runListProcessing);

app
    .use(router) // app routes
    .use(notFound) // 404
    .use(exceptionHandler); // default exception handler

/*** EXPORTS ***/

module.exports = app;
