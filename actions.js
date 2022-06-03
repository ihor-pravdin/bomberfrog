'use strict'

const {promisify} = require("es6-promisify");

/*** POOL ***/

const {pool} = require('./pool');

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
    return await query('select * from lists order by id desc limit ? offset ?;', [limit, offset]);
};

// getLists(50, 0).then(result => console.log(result))

const getListByName = async (name) => {
    const [result] = await query('select * from lists where name = ?;', [name]);
    return result;
};

// getListByName('31153dfd-f66f-4d83-a0d2-94d56f72946e').then(result => console.log(result))

const changeListStatus = async (name, status) => {
    return await withDBTransaction(async (conn, name, status) => {
        await _query(conn)('update lists set status = ?, updated_at = now() where name = ?;', [status, name]);
        const [result] = await _query(conn)('select * from lists where name = ?;', [name]);
        return result;
    })(name, status)
};

// changeListStatus('31153dfd-f66f-4d83-a0d2-94d56f72946e', 2).then(result => console.log(result))

/*** EXPORTS ***/

module.exports = {
    getLists,
    getListByName,
    changeListStatus
};
