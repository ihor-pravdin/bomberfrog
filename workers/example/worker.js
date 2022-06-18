const {parentPort, workerData} = require('worker_threads');

// parentPort.on("message", () => {});

setTimeout(() => {
    console.log('worker')
    parentPort.postMessage(workerData);
}, 10000)