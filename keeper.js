'use strict'

const EventEmitter = require('node:events');
const {Worker} = require('node:worker_threads');
const {scheduler} = require('node:timers/promises');

/*** CONFIG ***/

const {keeper: config} = require('./config');

/*** APP ERRORS ***/

const Err = require('./error');

/*** KEEPER ***/

// class

class Keeper extends EventEmitter {

    constructor() {
        super();
        this.workers = [];
        this.maxWorkers = config.maxWorkers;

        //todo: block keeper during workers creation

        this.on(Keeper.LIST_STATUS_CHANGED, payload => {
            //todo: create workers
           console.log(Keeper.LIST_STATUS_CHANGED, payload);
        });
    }

    createWorker(list) {
        const {name, worker: type} = list;

        const id = Date.now();

        const worker = new Worker(Keeper.workerPath(type), {workerData: {id, ...list}});

        worker.once('message', result => {
            console.log(result);
        });

        worker.on('error', err => {
            console.log(err);
        });

        worker.on("exit", exitCode => {
            this.workers = this.workers.filter(w => w.id !== id);
            console.log(`worker:${id} exited with code ${exitCode}`);
        });

        this.workers = [...this.workers, {id, name, type, worker}];

        return this;
    }

    async createWorkers(list, n) {
        if (n + this.count <= config.maxWorkers) {
            for(let i = 0; i < n; i++) {
                this.createWorker(list);
                await scheduler.wait(500);
            }
        } else {
            throw new Err(Err.MAX_WORKERS_COUNT, {
                max: config.maxWorkers,
                count: this.workers.length,
                n,
                description: `count + n > max`
            });
        }
        return this;
    }

}

// static

Keeper.instance = new Keeper();

//--

Keeper.LIST_STATUS_CHANGED = Symbol('LIST_STATUS_CHANGED');

//--

Keeper.workerPath = type => `${config.workersDir}/${type}/worker.js`;

/*** EXPORTS ***/

module.exports = Keeper;

// var keeper = new Keeper();
// keeper.createWorkers({worker: "example", name: "list001"}, 3)
//     .then(keeper => console.log(keeper))
//     .catch(err => console.log('Error:', err.message))

//keeper.createWorker({worker: "example", name: "list001"})

//console.log(keeper);