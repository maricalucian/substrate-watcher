const { ApiPromise, WsProvider } = require('@polkadot/api');
const { config } = require('./config');
const moment = require('moment'); // require
const hostname = 'polka_ade';
const { getDailyReward } = require('./data/previous_day_reward');
const { getActiveEra } = require('./data/active_era');
const { getRewardPointsActiveEra } = require('./data/reward_points_active_era');
const { getStaking } = require('./data/staking');
const { getRewardLastEra } = require('./data/rewards_last_era');
const { influx } = require('./influx/connection');

const addresses = config.addresses;
const wsProvider = new WsProvider(config.provider);

const startMonitoring = async () => {
    const apiClient = await ApiPromise.create({ provider: wsProvider });

    getData(apiClient);
    setInterval(() => {
        getData(apiClient);
    }, 1000 * config.poolingInterval);
};

const getData = async (api) => {
    const influxMetrics = [];

    // active era
    const { activeEra, ts } = await getActiveEra(api);

    influxMetrics.push({
        measurement: 'active_era',
        tags: { host: hostname },
        fields: { era: activeEra },
    });

    // daily earnings (previous day)
    const currentEraDate = moment(parseInt(ts));
    const lastDayText = currentEraDate.subtract(1, 'days').format('YYYY-MM-DD');

    const reward = await getDailyReward(api, config.addresses, lastDayText);

    addresses.forEach(address => {
        influxMetrics.push({
            measurement: 'daily_earnings',
            tags: { host: hostname, address },
            fields: { ksm: reward[address] },
        });
    })

    influxMetrics.push({
        measurement: 'daily_earnings',
        tags: { host: hostname, address: 'Total' },
        fields: { ksm: reward['total'] },
    });

    // const { nonce, data: balance } = await api.query.system.account(config.address);

    // reward points active era
    for (const address of addresses) {
        const reward = await getRewardPointsActiveEra(api, activeEra, address);

        influxMetrics.push({
            measurement: 'points_active_era',
            tags: { host: hostname, address },
            fields: { own: reward['own'], total: reward['total'] },
        });
    }

    // staking
    for (const address of addresses) {
        const stake = await getStaking(api, activeEra, address);

        influxMetrics.push({
            measurement: 'staking',
            tags: { host: hostname, address },
            fields: { own: stake['own'], others: stake['others'], total: stake['total'] },
        });
    }

    // last era reward
    const rewardsLastEra = await getRewardLastEra(api, 1453, addresses);
    addresses.forEach(address => {
        influxMetrics.push({
            measurement: 'reward_last_era',
            tags: { host: hostname, address },
            fields: { earning: rewardsLastEra[address].earning, own: rewardsLastEra[address].own, total: rewardsLastEra[address].total },
        });
    })

    // const validatorCount = await api.query.staking.validatorCount().then((data) => data.toNumber());
    // polkastake_validator_count.set(validatorCount);

    influx.writePoints(influxMetrics);
    console.log("metrics written");
};

module.exports = {
    startMonitoring,
};
