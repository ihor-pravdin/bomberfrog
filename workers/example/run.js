const {parentPort, workerData} = require('worker_threads');

setTimeout(() => {
    parentPort.postMessage(workerData);
}, 10000)