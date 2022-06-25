#!/usr/bin/env node
'use strict';

/*** CONFIG ***/

const {http: {port, hostname}} = require('./config');

/*** APP ***/

const app = require('./app');

/*** LOGGER ***/

const log = require('./logger').appLogger;

/*** POOL ***/

const {pool} = require('./pool');

/*** SERVER ***/

const server = app.listen(port, hostname, () => {
    log.info(`App server started!`, {hostname, port});
});

process.on('SIGINT', () => shutDown());
process.on('SIGTERM', () => shutDown());

function shutDown() {
    log.info('App server stopped!', {hostname, port});
    server.close(err => {
        log.info(`Http server closed!`);
        pool.end(() => {
            log.info('DB connection closed!');
            process.exit(err ? 1 : 0);
        });
    });
}
