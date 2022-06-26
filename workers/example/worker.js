'use strict';

const AbstractWorker = require('../worker');

const config = require('./config');

const action = require('../../actions');

const {create_worker_table_query} = require('./queries');

class Worker extends AbstractWorker {

    constructor(list, options = config) {
        super(list, options);
    }

    // todo: implement run() method

}

Worker.init = async ({name}) => await action.query(create_worker_table_query, [name]);

module.exports = Worker;
