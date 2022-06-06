'use strict';

const validator = require('validator');

/*** CHAINS STATE STORAGE ***/

const states = new WeakMap();

/*** VALIDATOR CHAIN ***/

function ValidatorChain(str) {
    states.set(this, {
        str,
        errors: [],
        sanitized: null
    });
}

Object.keys(validator).forEach(fn => {
    ValidatorChain.prototype[fn] = function (...args) {
        const {str, errors, sanitized} = states.get(this);
        const state = {str};
        const result = validator[fn].call(validator, sanitized || str, ...args);
        if (result === false) {
            errors.push({
                fn,
                msg: `${fn}(${args.join(', ')}) failed with '${str}'`,
                param: str
            });
        }
        state.sanitized = typeof result !== 'boolean' ? result : sanitized;
        state.errors = errors;
        states.set(this, state);
        return this;
    };
});

/*** STATIC ***/

ValidatorChain.check = str => new ValidatorChain(str);
// ValidatorChain.check('10')

ValidatorChain.isValid = chain => {
    const {errors} = states.get(chain);
    return !errors.length;
};
// ValidatorChain.isValid(ValidatorChain.check('10').isInt().toInt())

ValidatorChain.conform = chain => {
    const {errors, sanitized} = states.get(chain);
    return !errors.length ? sanitized || true : null;
};
// ValidatorChain.conform(ValidatorChain.check('10').isInt().toInt())

ValidatorChain.validationErrors = chain => states.get(chain).errors;
// ValidatorChain.validationErrors(ValidatorChain.check('10').isInt().toInt())

/*** EXPORTS ***/

module.exports = {
    validator,
    check: ValidatorChain.check,
    isValid: ValidatorChain.isValid,
    conform: ValidatorChain.conform,
    validationErrors: ValidatorChain.validationErrors
};
