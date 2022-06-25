'use strict';

const {createLogger, format, transports} = require("winston");

require("winston-daily-rotate-file");

/*** CONFIG ***/

const {logger: config} = require('./config');

/*** DEFAULT FORMAT ***/

const defaultFormat = format.combine(
    format.timestamp(),
    format.splat(),
    format.simple()
);

/*** APP LOGGER ***/

const appLogger = createLogger({
    format: defaultFormat,
    transports: [
        new transports.Console({
            level: config.app.level
        }),
        new transports.DailyRotateFile({
            filename: config.dir + "app-%DATE%.log",
            ...config.app
        })
    ]
});

/*** WORKER LOGGER ***/

const workerLogger = name => createLogger({
    format: defaultFormat,
    transports: [
        new transports.File({
            filename: `${config.dir}${name}.log`,
            level: config.worker.level
        })
    ]
});

/*** EXPORTS ***/

module.exports = {
    appLogger,
    workerLogger
};
