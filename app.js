'use strict'

const express = require('express');
const app = express();
const router = express.Router();
const {validationResult} = require('express-validator');

require('express-async-errors');

/*** CONSTANTS ***/

const {
    status: {
        NEW_STATUS,
        PROCESSING_STATUS,
        STOPPED_STATUS
    }
} = require('./constants');

/*** SPEC ***/

const spec = require('./spec');

/*** ACTIONS ***/

const action = require('./actions');

/*** ERROR ***/

const Err = require('./error');

/*** KEEPER ***/

const Keeper = require('./keeper');

/*** MIDDLEWARE ***/

const validationWrapper = fn => (req, res, next) => {
    const {errors} = validationResult(req);
    if (errors.length > 0) {
        const err = new Err(Err.VALIDATION_FAILED, {
            params: req.params,
            body: req.body,
            description: errors
        });
        //todo: path error to next()
        return res.status(400).json(err.data);
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

const processList = validationWrapper(async ({params: {name}}, res, next) => {
    const {status, options: {workers: required}} = await action.getListByName(name);
    const max = Keeper.instance.maxWorkers;
    const current = Keeper.instance.workers.length;
    if (max < required + current) {
        return next(new Err(Err.MAX_WORKERS_COUNT, {name, description: {max, current, required}}));
    }
    if (![NEW_STATUS, STOPPED_STATUS].includes(status)) {
        return next(new Err(Err.INVALID_LIST_STATUS, {name, status}));
    }
    const result = await action.setListStatus(name, PROCESSING_STATUS);
    Keeper.instance.emit(Keeper.LIST_STATUS_CHANGED, result);
    return result;
});

const notFound = (req, res) => {
    //todo: path error to next()
    res.status(404).json({error: 'Not found'})
};

const exceptionHandler = (err, req, res, next) => {
    //todo: handle app errors
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
    .post(spec.name, processList);

app
    .use(router) // app routes
    .use(notFound) // 404
    .use(exceptionHandler); // default exception handler

/*** EXPORTS ***/

module.exports = app;
