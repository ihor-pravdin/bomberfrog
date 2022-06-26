'use strict';

/*** LOGGER ***/

const {appLogger: log} = require('./logger');

/*** KEEPER ***/

const keeper = require('./keeper');

/*** INITIALIZATION ***/

keeper.init().then(() => {
    log.info('Keeper initialization complete.');
    process.exit(0);
}).catch(err => {
    log.error('Keeper initialization failed!');
    log.error(err.stack);
    process.exit(1);
});