#!/usr/bin/env node
'use strict';

const action = require('./actions');

action.createListsTable()
    .then(() => {
       console.log('Initialization complete.');
       process.exit(0);
    })
    .catch(err => {
        console.log('Initialization failed.', err);
        process.exit(1);
    });