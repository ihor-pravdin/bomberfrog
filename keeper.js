'use strict'

const {Worker} = require("worker_threads");
const {scheduler} = require('timers/promises');

/*** CONFIG ***/

const {keeper: config} = require('./config');

/*** APP ERRORS ***/

const Err = require('./error');

/*** KEEPER ***/

class Keeper {

    constructor() {
        this.workers = [];
    }

    getWorkersCount() {
        return this.workers.length;
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
        if (n + this.getWorkersCount() <= config.maxWorkers) {
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

    destroyWorker(id) {
        const worker = this.workers.filter(w => w.id === id)[0];
        if (worker) {
            worker.terminate();
        }
        return this;
    }

    destroyAllWorkers() {
        this.workers.forEach(({worker}) => worker.terminate());
        return this;
    }

}

Keeper.workerPath = type => `${config.workersDir}/${type}/worker.js`;

const keeper = new Keeper();

/*** EXPORTS ***/

module.exports = keeper;

// var keeper = new Keeper();
// keeper.createWorkers({worker: "example", name: "list001"}, 3)
//     .then(keeper => console.log(keeper))
//     .catch(err => console.log('Error:', err.message))

//keeper.createWorker({worker: "example", name: "list001"})

//console.log(keeper);