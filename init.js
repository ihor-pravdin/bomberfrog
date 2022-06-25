#!/usr/bin/env node
'use strict';

/*** LOGGER ***/

const {appLogger: log} = require('./logger');

/*** ACTIONS ***/

const action = require('./actions');

/*** INIT ***/

action.createListsTable()
    .then(() => {
       log.info('Initialization complete.');
       process.exit(0);
    })
    .catch(err => {
        log.error('Initialization failed!');
        log.error(err.stack);
        process.exit(1);
    });