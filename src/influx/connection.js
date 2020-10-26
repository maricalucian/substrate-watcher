const Influx = require('influx');
const { config } = require('../config');
const { schema } = require('./schema');

const influx = new Influx.InfluxDB({
    host: config.influx.host,
    port: config.influx.port,
    username: config.influx.username,
    password: config.influx.password,
    database: config.influx.database,
    schema
});

module.exports = {
    influx,
};
