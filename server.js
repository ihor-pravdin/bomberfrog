'use strict'

/*** CONSTANTS ***/

const statuses = require('./constants/status');
const {LIST_STATUS_CHANGED} = require('./constants/event');

/*** CONFIG ***/

const config = require('./config');

/*** EXPRESS ***/

const express = require('express');
const app = express();
const router = express.Router();
const {body, param, validationResult} = require('express-validator');

require('express-async-errors');

const validationWrapper = fn => (req, res, next) => {
    const {errors} = validationResult(req);
    if (errors.length > 0) {
        return res.status(400).json({error: errors});
    }
    const result = fn(req, res, next);
    return Promise.resolve(result).catch(next);
};

/*** POOL ***/

const {pool} = require('./pool');

/*** ACTIONS ***/

const action = require('./actions');

/*** WORKERS ***/

const {Worker} = require("worker_threads");

/*** EVENTS ***/

const EventEmitter = require('events');

class AppEmitter extends EventEmitter {}

const appEmitter = new AppEmitter();

appEmitter.on(LIST_STATUS_CHANGED, payload => {
    console.log(LIST_STATUS_CHANGED, payload);
});

/*** ROUTING ***/

app.use(express.json());

// /lists/:limit?/:offset?

router.route('/lists/:limit?/:offset?')
    .get(
        /* validation rules */
        param('limit').default(50).isInt({min: 1, max: 100}).toInt(),
        param('offset').default(0).isInt({min: 0}).toInt(),
        /* handler */
        validationWrapper(async ({params: {limit, offset}}, res) => {
            const result = await action.getLists(limit, offset);
            res.json(result);
        }));

// /list/:name

router.route('/list/:name')
    .get(
        /* validation rules */
        param('name').isUUID('4'),
        /* handler */
        validationWrapper(async ({params: {name}}, res) => {
            const result = await action.getListByName(name);
            res.json(result);
        }))
    .post(
        /* validation rules */
        param('name').isUUID('4'),
        body('status').isInt().toInt().isIn(Object.values(statuses)),
        /* handler */
        validationWrapper(async ({params: {name}, body: {status}}, res) => {
            const result = await action.changeListStatus(name, status);
            appEmitter.emit(LIST_STATUS_CHANGED, result);
            res.json(result);
        }));

app.use(router);

// 404

app.use((req, res) => {
    res.status(404).json({error: 'Not found'})
});

// default error handler

app.use((err, req, res, next) => {
    console.log(err);
    if (res.headersSent) {
        return next(err);
    }
    res.status(500).json({error: err.message || 'Unknown error'});
});

/*** SERVER ***/

const server = app.listen(config.port, () => {
    console.log(`APP SERVER started:`);
    console.log(`> Port: ${config.port}`);
});

process.on('SIGINT', () => shutDown());
process.on('SIGTERM', () => shutDown());

function shutDown() {
    console.log(`APP SERVER is closing:`);
    server.close(err => {
        console.log(`> HTTP SERVER ... closed`);
        pool.end(() => {
            console.log('> DB CONNECTION ... closed');
            process.exit(err ? 1 : 0);
        });
    });
}