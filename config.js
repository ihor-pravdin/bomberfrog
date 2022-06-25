'use strict';

const os = require('node:os');

const {check, conform} = require('./utils/validator');

/*** EXPORTS ***/

module.exports = {

    keeper: {
        workersDir: process.env.BF_WORKERS_DIR || './workers',
        maxWorkers: conform(check(process.env.BF_MAX_WORKERS).isInt({min: 1}).toInt()) || os.cpus().length
    },

    http: {
        port: conform(check(process.env.BF_API_SERVER_PORT).isInt({min: 3000}).toInt()) || 3001,
        hostname: process.env.BF_API_HOSTNAME || '127.0.0.1'
    },

    mysql: {
        connectionLimit: conform(check(process.env.BF_MAX_POOL_SIZE).isInt({min: 2}).toInt()) || 10,
        host: process.env.BF_MYSQL_HOST || 'localhost',
        user: process.env.BF_MYSQL_USER || 'root',
        password: process.env.BF_MYSQL_PASSWORD || 'bomberfrog',
        database: process.env.BF_MYSQL_DATABASE || 'bomberfrog'
    },

    logger: {
        dir: `${__dirname}/logs/`,
        app: {
            level: 'info',
            datePattern: "YYYY-MM-DD",
            maxSize: '10m',
            maxFiles: '14d',
            zippedArchive: true
        },
        worker: {
            level: 'info'
        }
    }

};
