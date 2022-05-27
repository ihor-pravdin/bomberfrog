'use strict'

/*** CONSTANTS ***/

const statuses = require('./constants/status.js');

/*** CONFIG ***/

const config = require('./config.js');

/*** EXPRESS ***/

const express = require('express');
const app = express();
const router = express.Router();
const {body, param, validationResult} = require('express-validator');

/*** MYSQL ***/

const mysql = require('mysql');
const pool = mysql.createPool(config.mysql);

/*** EVENTS ***/

const EventEmitter = require('events');

class AppEmitter extends EventEmitter {
}

const appEmitter = new AppEmitter();

/*** ROUTING ***/

app.use(express.json());

// /lists

router.route('/lists')
    .get((req, res) => {
        pool.query('select * from lists limit 100', (err, result) => {
            if (err) throw err;
            res.json(result);
        });
    });

// /list/:name

router.route('/list/:name')
    .get( //get list info
        param('name').isUUID('4'),
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({error: errors.array()});
            }
            const {params: {name}} = req;
            pool.query('select * from lists where name = ?',
                [name],
                (err, result) => {
                    if (err) throw err;
                    res.json(result[0]);
                });
        })
    .post( //change list status
        param('name').isUUID('4'),
        body('status').isInt().toInt().isIn(Object.values(statuses)),
        (req, res) => {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({error: errors.array()});
            }
            const {params: {name}, body: {status}} = req;
            pool.query('update lists set status = ?, updated_at = now() where name = ?',
                [status, name],
                (err, _) => {
                    if (err) throw err;
                    res.json({status});
                });
        });

// 404

router.all('/*', (_, res) => res.status(404).json({error: 'Not found'}));

app.use(router);

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