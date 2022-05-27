'use strict'

/*** CONSTANTS ***/

const statuses = require('./constants/status.js');
const {LIST_STATUS_CHANGED} = require('./constants/event.js');

/*** CONFIG ***/

const config = require('./config.js');

/*** EXPRESS ***/

const express = require('express');
const app = express();
const router = express.Router();
const {body, param, validationResult} = require('express-validator');
require('express-async-errors');

/*** MYSQL ***/

const mysql = require('mysql');
const {promisify} = require("es6-promisify");
const pool = mysql.createPool(config.mysql);
const getConnection = promisify(pool.getConnection.bind(pool));
const query = promisify(pool.query.bind(pool));

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
        param('limit').default(50).isInt({min: 1, max: 100}).toInt(),
        param('offset').default(0).isInt({min: 0}).toInt(),
        async (req, res) => {
            const {params: {limit, offset}} = req;
            const {errors} = validationResult(req);
            if (errors.length > 0) {
                res.status(400).json({error: errors});
            } else {
                const result = await query('select * from lists order by id desc limit ? offset ?;', [limit, offset]);
                res.json(result);
            }
        });

// /list/:name

router.route('/list/:name')
    .get(
        param('name').isUUID('4'),
        async (req, res, next) => {
            const {params: {name}} = req;
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({error: errors.array()});
            } else {
                const [result] = await query('select * from lists where name = ?', [name]);
                res.json(result);
            }
        })
    .post(
        param('name').isUUID('4'),
        body('status').isInt().toInt().isIn(Object.values(statuses)),
        async (req, res, next) => {
            const {params: {name}, body: {status}} = req;
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                res.status(400).json({error: errors.array()});
            } else {
                const conn = await getConnection();
                try {
                    await promisify(conn.beginTransaction.bind(conn))();
                    await promisify(conn.query.bind(conn))('update lists set status = ?, updated_at = now() where name = ?', [status, name]);
                    const [result] = await promisify(conn.query.bind(conn))('select * from lists where name = ?', [name]);
                    appEmitter.emit(LIST_STATUS_CHANGED, result);
                    await promisify(conn.commit.bind(conn))();
                    res.json(result);
                } catch (err) {
                    if (conn) {
                        await promisify(conn.rollback.bind(conn))();
                    }
                    next(err);
                } finally {
                    if (conn) {
                        conn.release();
                    }
                }
            }
        });

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