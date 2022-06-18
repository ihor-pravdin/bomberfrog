'use strict';

const EventEmitter = require('node:events');
const {Worker} = require('node:worker_threads');
const {scheduler} = require('node:timers/promises');

/*** CONFIG ***/

const {keeper: config} = require('./config');

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
        const worker = new Worker(`${this.workersDir}/${type}/worker.js`, {workerData: {id, ...list}});

        worker.once('message', result => {
            console.log(`result [${id}]`, result);
            if (this.workers.filter(w => w.name === name).length === 1) {
                this.emit(Keeper.LIST_PROCESSING_FINISHED, list);
            }
        });

        worker.once('error', err => {
            console.log(`error [${id}]`, err);
            if (this.workers.filter(w => w.name === name).length === 1) {
                this.emit(Keeper.LIST_PROCESSING_FAILED, list);
            }
        });

        worker.once("exit", exitCode => {
            console.log(`Worker '${name}:${id}' exited with code ${exitCode}.`);
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
    }

}

// INSTANCE

Keeper.instance = new Keeper();

// EVENTS

Keeper.PROCESS_LIST = Symbol('PROCESS_LIST');
Keeper.LIST_PROCESSING_FINISHED = Symbol('LIST_PROCESSING_FINISHED');
Keeper.LIST_PROCESSING_FAILED = Symbol('LIST_PROCESSING_FAILED');

// HANDLERS

Keeper.instance.on(Keeper.PROCESS_LIST, list => {
    console.log(`List '${list.name}' is starting.`);
    Keeper.instance.createWorkers(list)
        .then(() => {
            console.log(`List '${list.name}' started.`);
        })
        .catch(err => {
            console.log('err', err);
        });
});

Keeper.instance.on(Keeper.LIST_PROCESSING_FINISHED, ({name, updated_at}) => {
    action.setListStatus(name, FINISHED_STATUS).then(list => {
        console.log(`List '${name}' finished.`);
        console.log(`Time: ${list['updated_at'].getTime() - updated_at.getTime()} ms.`);
    }).catch(err => {
        console.log('err', err);
    });
});

Keeper.instance.on(Keeper.LIST_PROCESSING_FAILED, ({name, updated_at}) => {
    action.setListStatus(name, FAILED_STATUS).then(list => {
        console.log(`List '${name}' failed.`);
        console.log(`Time: ${list['updated_at'].getTime() - updated_at.getTime()} ms.`);
    }).catch(err => {
        console.log('err', err);
    });
});

/*** EXPORTS ***/

module.exports = Keeper.instance;
