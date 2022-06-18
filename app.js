'use strict';

const express = require('express');
const app = express();
const router = express.Router();

require('express-async-errors');

/*** SPEC ***/

const spec = require('./spec');

/*** HANDLERS ***/

const handler = require('./handlers');

/*** ROUTES ***/

router
    .route('/lists/:limit?/:offset?')
    .get(
        spec.limit,
        spec.offset,
        spec.validate,
        handler.getLists
    );

router
    .route('/list/:name?')
    .get(
        spec.name,
        spec.validate,
        handler.getListByName
    )
    .put(
        spec.worker,
        spec.description,
        spec.workers,
        spec.delay,
        spec.validate,
        handler.createList
    );

router
    .route('/process/list/:name')
    .post(
        spec.name,
        spec.validate,
        handler.processList
    );

app
    .use(express.json())
    .use(router) // app routes
    .use(handler.notFound) // 404
    .use(handler.exceptionHandler); // default exception handler

/*** EXPORTS ***/

module.exports = app;
