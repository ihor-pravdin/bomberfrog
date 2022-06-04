'use strict'

const {promisify} = require('es6-promisify');

/*** CONSTANTS ***/

const {
    LIST_PROCESSING_STATUS,
    LIST_NEW_STATUS,
    LIST_STOPPED_STATUS
} = require('./constants/status');

/*** POOL ***/

const {pool} = require('./pool');

/*** APP ERRORS ***/

const Err = require('./error');

/*** QUERIES ***/

const select_lists_query = 'select * from lists order by id desc limit ? offset ?;';

const select_list_query = 'select * from lists where name = ?;';

const update_list_status_query = 'update lists set status = ? where name = ?;';

/*** HELPERS ***/

const _query = conn => promisify(conn.query.bind(conn));

const query = promisify(pool.query.bind(pool));

const getConnection = promisify(pool.getConnection.bind(pool));

const withDBTransaction = fn => async (...args) => {
    const conn = await getConnection();
    try {
        await promisify(conn.beginTransaction.bind(conn))();
        const result = await fn.call(null, conn, ...args);
        await promisify(conn.commit.bind(conn))();
        return result;
    } catch (err) {
        if (conn) {
            await promisify(conn.rollback.bind(conn))();
        }
        throw err;
    } finally {
        if (conn) {
            conn.release();
        }
    }
};

/*** ACTIONS ***/

const getLists = async (limit, offset) => {
    return await query(select_lists_query, [limit, offset]);
};

// getLists(50, 0).then(result => console.log(result))

const getListByName = async (name) => {
    const [result] = await query(select_list_query, [name]);
    if (!result) {
        throw new Err(Err.UNKNOWN_LIST, {name});
    }
    return result;
};

// getListByName('31153dfd-f66f-4d83-a0d2-94d56f72946e').then(result => console.log(result))

const changeListStatus = async (name, status) => {
    return await withDBTransaction(async (conn, name, status) => {
        await _query(conn)(update_list_status_query, [status, name]);
        const [result] = await _query(conn)(select_list_query, [name]);
        return result;
    })(name, status)
};

// changeListStatus('31153dfd-f66f-4d83-a0d2-94d56f72946e', 2).then(result => console.log(result))

const setProcessingListStatus = async (name) => {
    return await withDBTransaction(async (conn, name) => {
        const [list] = await _query(conn)(select_list_query, [name]);
        const {status} = list;
        if (!list) {
            throw new Err(Err.UNKNOWN_LIST, {name});
        }
        if (![LIST_NEW_STATUS, LIST_STOPPED_STATUS].includes(status)) {
            throw new Err(Err.INVALID_LIST_STATUS, {name, status});
        }
        await _query(conn)(update_list_status_query, [LIST_PROCESSING_STATUS, name]);
        return {
            ...list,
            status: LIST_PROCESSING_STATUS,
            updated_at: new Date()
        };
    })(name);
};

// runListProcessing('31153dfd-f66f-4d83-a0d2-94d56f72946e').then(result => console.log(result))

/*** EXPORTS ***/

module.exports = {
    getLists,
    getListByName,
    changeListStatus,
    setProcessingListStatus
};
