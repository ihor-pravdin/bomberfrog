'use strict';

import {mysql} from '../db';
import {workerLogger} from '../logger';

export class Worker {

    constructor(list, options) {
        this.pool = mysql.createPool(options.mysql);
        this.log = workerLogger(list.name);
        this.list = list;
    }

    async init(listName) {
        this.log.info(`Worker '${listName}' initialization.`);
    }

}