#!/usr/bin/env node
'use strict';

/*** CONFIG ***/

const {http: {port, hostname}} = require('./config');

/*** APP ***/

const app = require('./app');

/*** POOL ***/

const {pool} = require('./pool');

/*** SERVER ***/

const server = app.listen(port, hostname, () => {
    console.log(`APP SERVER started:`);
    console.log(`> Hostname: ${hostname}`);
    console.log(`> Port: ${port}`);
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
