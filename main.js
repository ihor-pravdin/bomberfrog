'use strict'

const express = require('express');
const app = express();
const router = express.Router();
const bodyParser = require('body-parser')

const config = require('./config.js');

const lists = [
    {
        name: "001",
        description: "foo foo",
        created_at: 1653604884125,
        updated_at: null,
        done: false
    },
    {
        name: "002",
        description: "bar bar",
        created_at: 1653604884126,
        updated_at: null,
        done: false
    }
];

router.get('/lists', (req, res) => {
    res.json(lists);
});

router.all('*', (req, res) => {
    res.status(404).send('Not found');
});

app.use(bodyParser.json());
app.use(router);

app.listen(config.port, () => {
    console.log(`BF API SERVER listening on port ${config.port}`)
});