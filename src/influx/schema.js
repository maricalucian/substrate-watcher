const Influx = require('influx');

const schema = [
    {
        measurement: 'active_era',
        fields: {
            era: Influx.FieldType.INTEGER,
        },
        tags: ['host'],
    },
    {
        measurement: 'points_active_era',
        fields: {
            own: Influx.FieldType.INTEGER,
            total: Influx.FieldType.INTEGER,
        },
        tags: ['host', 'address'],
    },
    {
        measurement: 'daily_earnings',
        fields: {
            ksm: Influx.FieldType.FLOAT,
        },
        tags: ['host', 'address'],
    },
    {
        measurement: 'staking',
        fields: {
            own: Influx.FieldType.INTEGER,
            others: Influx.FieldType.INTEGER,
            total: Influx.FieldType.INTEGER,
        },
        tags: ['host', 'address'],
    },
    {
        measurement: 'reward_last_era',
        fields: {
            earning: Influx.FieldType.FLOAT,
            own: Influx.FieldType.FLOAT,
            total: Influx.FieldType.FLOAT,
        },
        tags: ['host', 'address'],
    },
];

module.exports = {
  schema
};
