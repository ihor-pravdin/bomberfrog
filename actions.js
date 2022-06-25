'use strict';

const {v4: uuid} = require('uuid');
const {promisify} = require('node:util');

/*** POOL ***/

const {pool} = require('./pool');

/*** ERROR ***/

const Err = require('./error');

/*** QUERIES ***/

const {
    select_list_query,
    select_lists_query,
    insert_list_query,
    update_list_status_query,
    create_list_table_query
} = require('./queries');

/*** HELPERS ***/

const _query = conn => promisify(conn.query.bind(conn)); // conn.query( ... );

const query = promisify(pool.query.bind(pool)); // pool.query( ... );

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

/* PRIVATE */

const selectLists = async (conn, limit, offset) => {
    const qfn = conn ? _query(conn) : query; // query function
    const results = await qfn(select_lists_query, [limit, offset]);
    return results.map(row => {
        const options = JSON.parse(row.options);
        return {...row, options};
    });
};

const selectListByName = async (conn, name) => {
    const qfn = conn ? _query(conn) : query;
    const [result] = await qfn(select_list_query, [name]);
    if (!result) {
        throw new Err(Err.UNKNOWN_LIST, {name});
    }
    const options = JSON.parse(result.options);
    return {...result, options};
};

const insertList = async (conn, {name, worker, description, options}) => {
    const qfn = conn ? _query(conn) : query;
    return await qfn(insert_list_query, [name, worker, description, JSON.stringify(options)]);
};

const updateListStatus = async (conn, name, status) => {
    const qfn = conn ? _query(conn) : query;
    return await qfn(update_list_status_query, [status, name]);
};

/* PUBLIC */

const getLists = selectLists.bind(null, null);
// getLists(50, 0).then(result => console.log(result))

const getListByName = selectListByName.bind(null, null);
// getListByName('31153dfd-f66f-4d83-a0d2-94d56f72946e').then(result => console.log(result))

const setListStatus = async (name, status) => {
    return await withDBTransaction(async (conn, name, status) => {
        await updateListStatus(conn, name, status);
        return await selectListByName(conn, name);
    })(name, status);
};
// setListStatus('31153dfd-f66f-4d83-a0d2-94d56f72946e', 2).then(result => console.log(result))

const addList = async (data) => {
    return await withDBTransaction(async (conn, data) => {
        const name = uuid();
        await insertList(conn, {name, ...data});
        return await selectListByName(conn, name);
    })(data);
};
// addList({worker: "example", description: "foo", options: {delay: 1000, workers: 2}}).then(result => console.log(result))

const createListsTable = async () => await query(create_list_table_query);
// createListsTable().then(result => console.log(result))

/*** EXPORTS ***/

module.exports = {
    getLists,
    getListByName,
    setListStatus,
    addList,
    createListsTable
};