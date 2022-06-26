'use strict';

//const {promisify} = require('node:util');

const {mysql} = require('../db');
const {workerLogger} =  require('../logger');

class AbstractWorker {

    constructor(list, options) {
        this.pool = mysql.createPool(options.mysql);
        //this.query = promisify(this.pool.query.bind(this.pool));
        this.log = workerLogger(list.name);
        this.list = list;
    }

    async run() {
        throw new Error(`'run' method is not realized.`);
    }

}

module.exports = AbstractWorker;
