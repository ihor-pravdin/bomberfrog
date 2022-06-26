'use strict';

const {promisify} = require('node:util');

const AbstractWorker = require('../worker');

const config = require('./config');

const {pool} = require('../../db');

const {create_worker_table_query} = require('./queries');

class Worker extends AbstractWorker {

    constructor(list, options = config) {
        super(list, options);
    }

    // todo: implement run() method

}

Worker.init = async list => {
    const {name} = list;
    return await promisify(pool.query.bind(pool))(create_worker_table_query, [name]);
};

module.exports = Worker;
