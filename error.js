'use strict'

class Err extends Error {

    constructor(msg, data = {}) {
        super(msg);
        this.data = {error: msg, ...data};
    }

}

/*** ERRORS ***/

Err.UNKNOWN_LIST = 'UNKNOWN_LIST';
Err.INVALID_LIST_STATUS = 'INVALID_LIST_STATUS';
Err.MAX_WORKERS_COUNT = 'MAX_WORKERS_COUNT';

/*** EXPORTS ***/

module.exports = Err;