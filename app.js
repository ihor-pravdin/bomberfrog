'use strict'

const express = require('express');
const app = express();
const router = express.Router();
const {validationResult} = require('express-validator');

require('express-async-errors');

/*** CONSTANTS ***/

const {
    status: {
        __NEW__,
        __PROCESSING__,
        __STOPPED__
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
    const {status, options: {workers}} = await action.getListByName(name);
    if (Keeper.instance.maxWorkers < workers + Keeper.instance.workers.length) {
        return next(new Err(Err.MAX_WORKERS_COUNT, {
            name,
            description: {
                max: Keeper.instance.maxWorkers,
                current: Keeper.instance.workers.length,
                requested: workers
            }
        }));
    }
    if (![__NEW__, __STOPPED__].includes(status)) {
        return next(new Err(Err.INVALID_LIST_STATUS, {name, status}));
    }
    const result = await action.setListStatus(name, __PROCESSING__);
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
