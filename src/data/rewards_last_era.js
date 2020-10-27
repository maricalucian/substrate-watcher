const BN = require('bn.js');
const { config } = require('../config');
const divider = new BN(config.dividend, 10);
const { calculateReward } = require('../utils/reward_calculator');

const getRewardLastEra = async (api, lastEra, addresses) => {
    const lastEraRewardTotal = await api.query.staking.erasValidatorReward(lastEra).then((data) => {
        const totalBn = new BN(data.toString());
        return totalBn.div(divider).toNumber() / 1000;
    });

    const rewardDataLastEra = await api.query.staking.erasRewardPoints(lastEra);
    const rewardPointsLastEra = rewardDataLastEra.get('individual').toJSON();
    const rewards = [];

    for (const address of addresses) {
        const rewardQuota =
            (rewardPointsLastEra[address] ? rewardPointsLastEra[address] : 0) /
            rewardDataLastEra.get('total').toNumber();


        const stakers = await api.query.staking.erasStakers(lastEra, address);
        const stakeValTotal = stakers.get('total').toBn().div(divider).toNumber() / 1000;
        const stakeValOwn = stakers.get('own').toBn().div(divider).toNumber() / 1000;

        rewards[address] = {
            earning: calculateReward(stakeValOwn, stakeValTotal, lastEraRewardTotal * rewardQuota),
            own: lastEraRewardTotal * rewardQuota,
            total: lastEraRewardTotal,
        };
    }

    return rewards;
};

module.exports = {
    getRewardLastEra,
};
