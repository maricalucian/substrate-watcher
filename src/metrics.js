const createMetrics = (client) => ({
    polkastake_reward_points: new client.Gauge({
        name: 'polkastake_reward_points',
        help: 'polkastake_reward_points',
        labelNames: ['type'],
    }),

    polkastake_active_era: new client.Gauge({
        name: 'polkastake_active_era',
        help: 'polkastake_active_era',
    }),

    polkastake_staking: new client.Gauge({
        name: 'polkastake_staking',
        help: 'polkastake_staking',
        labelNames: ['type'],
    }),

    polkastake_era_reward: new client.Gauge({
        name: 'polkastake_era_reward',
        help: 'polkastake_era_reward',
        labelNames: ['type'],
    }),

    polkastake_validator_count: new client.Gauge({
        name: 'polkastake_validator_count',
        help: 'polkastake_validator_count',
    }),
});

module.exports = {
    createMetrics,
};
