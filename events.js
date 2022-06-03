'use strict'

const EventEmitter = require('events');

class AppEmitter extends EventEmitter {}

const appEmitter = new AppEmitter();

/*** CONSTANTS ***/

const {LIST_STATUS_CHANGED} = require('./constants/event');

/*** EVENT HANDLERS ***/

appEmitter.on(LIST_STATUS_CHANGED, payload => {
    console.log(LIST_STATUS_CHANGED, payload);
});

/*** EXPORTS ***/

module.exports = appEmitter;
