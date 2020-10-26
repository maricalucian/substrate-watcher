const BN = require('bn.js');
const { config } = require('../config');
const divider = new BN(config.dividend, 10);

const getRewardLastEra = async (api, lastEra, addresses) => {
    const lastEraRewardTotal = await api.query.staking.erasValidatorReward(lastEra).then((data) => {
        const totalBn = new BN(data.toString());
        return totalBn.div(divider).toNumber() / 1000;
    });

    const rewardDataLastEra = await api.query.staking.erasRewardPoints(lastEra);
    const rewardPointsLastEra = rewardDataLastEra.get('individual').toJSON();
    const rewards = [];

    addresses.forEach((address) => {
        const rewardQuota =
            (rewardPointsLastEra[address] ? rewardPointsLastEra[address] : 0) /
            rewardDataLastEra.get('total').toNumber();

        rewards[address] = {
            earning: (lastEraRewardTotal * rewardQuota) / 10,
            own: lastEraRewardTotal * rewardQuota,
            total: lastEraRewardTotal,
        };
    });

    return rewards;
};

module.exports = {
    getRewardLastEra,
};
