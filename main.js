'use strict'

// CONFIG

const config = require('./config.js');

// EXPRESS

const express = require('express')
const app = express()
const router = express.Router()

// MYSQL

const mysql = require('mysql')
const pool = mysql.createPool(config.mysql)

// ROUTING

router.get('/lists', (req, res) => {
    pool.query(`select * from lists limit 100`, (err, result) => {
        if (err) throw err;
        res.json(result)
    })
})

router.all('*', (_, res) => {
    res.status(404).send('Not found')
})

app.use(express.json())
app.use(router)

// SERVER

const server = app.listen(config.port, () => {
    console.log(`APP SERVER started:`)
    console.log(`> Port: ${config.port}`)
})

process.on('SIGINT', () => shutDown())
process.on('SIGTERM', () => shutDown())

function shutDown () {
    console.log(`APP SERVER is closing:`)
    server.close(err => {
        console.log(`> HTTP SERVER ... closed`)
        pool.end(() => {
            console.log('> DB CONNECTION ... closed')
            process.exit(err ? 1 : 0)
        })
    })
}