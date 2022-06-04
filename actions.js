'use strict'

const {promisify} = require('util');

/*** POOL ***/

const {pool} = require('./pool');

/*** ERROR ***/

const Err = require('./error');

/*** QUERIES ***/

const select_lists_query = 'select * from lists order by list_id desc limit ? offset ?;';

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

/* PRIVATE */

const selectLists = async (conn, limit, offset) => {
    const qfn = conn ? _query(conn) : query; // query function
    const results = await qfn(select_lists_query, [limit, offset])
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

/*** EXPORTS ***/

module.exports = {
    getLists,
    getListByName,
    setListStatus,
};