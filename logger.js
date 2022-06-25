'use strict';

const {createLogger, format, transports} = require("winston");

require("winston-daily-rotate-file");

/*** APP LOGGER ***/

const appLogger = createLogger({
    format: format.combine(
        format.timestamp(),
        format.splat(),
        format.simple()
    ),
    transports: [
        new transports.Console({
            level: 'info'
        }),
        new transports.DailyRotateFile({
            filename: "logs/app-%DATE%.log",
            datePattern: "YYYY-MM-DD",
            zippedArchive: true,
            maxSize: "20m",
            maxFiles: "14d",
            level: 'info'
        })
    ]
});

/*** WORKER LOGGER ***/

const workerLogger = name => createLogger({
    format: format.combine(
        format.timestamp(),
        format.splat(),
        format.simple()
    ),
    transports: [
        new transports.File({
            filename: `${__dirname}/logs/${name}.log`,
            level: 'info'
        })
    ]
});


/*** EXPORTS ***/

module.exports = {
    appLogger,
    workerLogger
};

// appLogger.info('foo');
// appLogger.info('foo', {foo: 'foo'}, {bar: 'bar'});