const {parentPort, workerData} = require('worker_threads');

// parentPort.on("message", () => {});

setTimeout(() => {
    parentPort.postMessage(workerData);
}, 10000)