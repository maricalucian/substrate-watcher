const { ApiPromise, WsProvider } = require('@polkadot/api');
const { createMetrics } = require('./metrics');
const BN = require('bn.js');
const client = require('prom-client');
const { config } = require('./config');

const divider = new BN(config.dividend, 10);

const {
    polkastake_reward_points,
    polkastake_active_era,
    polkastake_staking,
    polkastake_era_reward,
    polkastake_validator_count,
} = createMetrics(client);

const wsProvider = new WsProvider(config.provider);

const startMonitoring = async () => {
    const apiClient = await ApiPromise.create({ provider: wsProvider });

    setInterval(() => {
        getData(apiClient);
    }, 1000 * config.poolingInterval);
};

const getData = async (api) => {
    // active era
    const activeEra = await api.query.staking.activeEra().then((data) => data._raw.index.toNumber());
    const lastEra = activeEra - 1;
    polkastake_active_era.set(activeEra);

    // reward points
    const rewardData = await api.query.staking.erasRewardPoints(activeEra);
    const rewardPoints = rewardData.get('individual').toJSON();
    polkastake_reward_points.set({ type: 'own' }, rewardPoints[config.address] ? rewardPoints[config.address] : 0);
    polkastake_reward_points.set({ type: 'total' }, rewardData.get('total').toNumber());

    // staking
    const stakers = await api.query.staking.erasStakers(activeEra, config.address);
    const stakeValTotal = stakers.get('total')._raw.div(divider).toNumber() / 1000;
    const stakeValOwn = stakers.get('own')._raw.div(divider).toNumber() / 1000;
    polkastake_staking.set({ type: 'own' }, stakeValOwn);
    polkastake_staking.set({ type: 'total' }, stakeValTotal);
    polkastake_staking.set({ type: 'others' }, stakeValTotal - stakeValOwn);

    // last era reward tokens
    const lastEraRewardTotal = await api.query.staking
        .erasValidatorReward(lastEra)
        .then((data) => data._raw.div(divider).toNumber() / 1000);
    const rewardDataLastEra = await api.query.staking.erasRewardPoints(lastEra);
    const rewardPointsLastEra = rewardDataLastEra.get('individual').toJSON();
    const rewardQuota =
        (rewardPointsLastEra[config.address] ? rewardPointsLastEra[config.address] : 0) /
        rewardDataLastEra.get('total').toNumber();
    polkastake_era_reward.set({ type: 'own' }, lastEraRewardTotal * rewardQuota);
    polkastake_era_reward.set({ type: 'total' }, lastEraRewardTotal);

    // validators count
    const validatorCount = await api.query.staking.validatorCount().then((data) => data.toNumber());
    polkastake_validator_count.set(validatorCount)
};

module.exports = {
    startMonitoring,
};
