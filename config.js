module.exports = {

    port: process.env.BF_API_SERVER_PORT || 3001,

    maxParallelLists: process.env.BF_MAX_PARALLEL_LISTS || 5,

    maxWorkers: process.env.BF_MAX_WORKERS || 3,

    mysql: {
        connectionLimit: process.env.BF_MAX_POOL_SIZE || 10,
        host: process.env.BF_MYSQL_HOST || 'localhost',
        user: process.env.BF_MYSQL_USER || 'root',
        password: process.env.BF_MYSQL_PASSWORD || 'bomberfrog',
        database: process.env.BF_MYSQL_DATABASE || 'bomberfrog'
    }

}
