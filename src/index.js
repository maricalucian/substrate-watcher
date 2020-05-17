const express = require('express');
const client = require('prom-client');
const { startMonitoring } = require('./monitor');
const { config } = require('./config');

const server = express();

startMonitoring();

server.get('/metrics', (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(client.register.metrics());
});

server.listen(config.port);
