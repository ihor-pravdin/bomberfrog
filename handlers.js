'use strict';

/*** CONSTANTS ***/

const {
    status: {
        NEW_STATUS,
        PROCESSING_STATUS,
        STOPPED_STATUS
    }
} = require('./constants');

/*** ACTIONS ***/

const action = require('./actions');

/*** ERROR ***/

const Err = require('./error');

/*** KEEPER ***/

const Keeper = require('./keeper');

/*** ROUTER HANDLERS ***/

// 404

const notFound = (req, res, next) => next(new Err(Err.UNKNOWN_ROUTE, {url: req.originalUrl}));

// default exception handler

const exceptionHandler = (err, req, res, next) => {
    console.log(err);
    if (res.headersSent) {
        return next(err);
    }
    switch (true) {
        case (err instanceof Err):

            switch (err.message) {
                // 404
                case Err.UNKNOWN_ROUTE:
                    return res.status(404).json(err.data);

                default:
                    return res.status(400).json(err.data);
            }

        default:
            const error = new Err(Err.UNKNOWN_ERROR, {description: err.message})
            return res.status(500).json(error.data);
    }
};

//

const getLists = async ({params: {limit, offset}}, res) => {
    const result = await action.getLists(limit, offset);
    res.json(result);
};

//

const getListByName = async ({params: {name}}, res) => {
    const result = await action.getListByName(name);
    res.json(result);
};

//

const processList = async ({params: {name}}, res, next) => {
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
    res.json(result);
};

/*** EXPORTS ***/

module.exports = {
    notFound,
    exceptionHandler,
    getLists,
    getListByName,
    processList
};
