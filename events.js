'use strict'

const EventEmitter = require('events');

/*** INSTANCE ***/

class Event extends EventEmitter {}

Event.instance = new Event();

/*** ***/

Event.LIST_STATUS_CHANGED = Symbol('LIST_STATUS_CHANGED');

/*** HANDLERS ***/

Event.instance.on(Event.LIST_STATUS_CHANGED, payload => {
    console.log(Event.LIST_STATUS_CHANGED, payload);
});

/*** EXPORTS ***/

module.exports = Event;
