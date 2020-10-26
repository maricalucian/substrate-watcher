const { config } = require('../config');
const BN = require('bn.js');
const divider = new BN(config.dividend, 10);

const getStaking = async (api, activeEra, address) => {
    const stakers = await api.query.staking.erasStakers(activeEra, address);
    const stakeValTotal = stakers.get('total').toBn().div(divider).toNumber() / 1000;
    const stakeValOwn = stakers.get('own').toBn().div(divider).toNumber() / 1000;

    return {
        own: stakeValOwn,
        total: stakeValTotal,
        others: stakeValTotal - stakeValOwn,
    };
};

module.exports = {
    getStaking,
};
