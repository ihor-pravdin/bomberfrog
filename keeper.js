'use strict';

const EventEmitter = require('node:events');
const {Worker} = require('node:worker_threads');
const {scheduler} = require('node:timers/promises');

/*** CONFIG ***/

const {keeper: config} = require('./config');

/*** LOGGER ***/

const {appLogger: log} = require('./logger');

/*** CONSTANTS ***/

const {
    status: {
        FINISHED_STATUS,
        FAILED_STATUS
    }
} = require('./constants');

/*** ACTIONS ***/

const action = require('./actions');

/*** KEEPER ***/

// CLASS

class Keeper extends EventEmitter {

    constructor(options = config) {
        super();
        this.workers = [];
        this.busy = false;
        this.workersDir = options.workersDir;
        this.maxWorkers = options.maxWorkers;
    }

    createWorker(list) {
        const {name, worker: type} = list;
        const id = Date.now();
        const filePath = `${this.workersDir}/${type}/run.js`;
        const worker = new Worker(filePath, {workerData: {id, ...list}});

        worker.once('message', result => {
            log.debug(`Worker '${name}::${id}' result:`, result);
            if (this.workers.filter(w => w.name === name).length === 1) {
                this.emit(Keeper.LIST_PROCESSING_FINISHED, list);
            }
        });

        worker.once('error', err => {
            log.error(`Worker '${name}::${id}' error:`, err.stack);
            if (this.workers.filter(w => w.name === name).length === 1) {
                this.emit(Keeper.LIST_PROCESSING_FAILED, list);
            }
        });

        worker.once('exit', exitCode => {
            log.debug(`Worker '${name}::${id}' exited with code ${exitCode}.`);
            this.workers = this.workers.filter(w => w.id !== id);
        });

        this.workers = [...this.workers, {id, name, type, worker}];
        return this;
    }

    async createWorkers(list) {
        if (this.busy === false) {
            const {options: {delay, workers: n}} = list;
            this.busy = true;
            for (let i = 0; i < n; i++) {
                this.createWorker(list);
                if (delay && delay !== 0) {
                    await scheduler.wait(delay);
                }
            }
            this.busy = false;
        }
        return this;
    }

    processList(list) {
        this.emit(Keeper.PROCESS_LIST, list);
        return this;
    }

}

// INIT

Keeper.init = async () => await action.createListsTable();

// INSTANCE

Keeper.instance = new Keeper();

// EVENTS

Keeper.PROCESS_LIST = Symbol('PROCESS_LIST');
Keeper.LIST_PROCESSING_FINISHED = Symbol('LIST_PROCESSING_FINISHED');
Keeper.LIST_PROCESSING_FAILED = Symbol('LIST_PROCESSING_FAILED');

// PROCESS_LIST

Keeper.instance.on(Keeper.PROCESS_LIST, list => {
    Keeper.instance.createWorkers(list)
        .then(() => {
            log.info(`List '${list.name}' started.`);
        })
        .catch(err => {
            log.error(`List '${list.name}' starting failed.`, list);
            log.error(err.stack);
        });
});

// LIST_PROCESSING_FINISHED

Keeper.instance.on(Keeper.LIST_PROCESSING_FINISHED, list => {
    const {name, updated_at} = list;
    action.setListStatus(name, FINISHED_STATUS).then(list => {
        const time = list['updated_at'].getTime() - updated_at.getTime();
        log.info(`List '${name}' finished.`, {time});
    }).catch(err => {
        log.error(`List '${name}' finishing failed.`, list);
        log.error(err.stack);
    });
});

// LIST_PROCESSING_FAILED

Keeper.instance.on(Keeper.LIST_PROCESSING_FAILED, list => {
    const {name, updated_at} = list;
    action.setListStatus(name, FAILED_STATUS).then(list => {
        const time = list['updated_at'].getTime() - updated_at.getTime();
        log.info(`List '${name}' failed.`, {time});
    }).catch(err => {
        log.error(`List '${name}' failing failed.`, list);
        log.error(err.stack);
    });
});

/*** EXPORTS ***/

module.exports = {
    instance: Keeper.instance,
    init: Keeper.init
};
