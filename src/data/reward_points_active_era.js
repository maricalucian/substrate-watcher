const getRewardPointsActiveEra = async (api, activeEra, address) => {
    const rewardData = await api.query.staking.erasRewardPoints(activeEra);
    const rewardPoints = rewardData.get('individual').toJSON();
    return {
        own: rewardPoints[address] || 0,
        total: rewardData.get('total').toNumber(),
    };
};

module.exports = {
    getRewardPointsActiveEra,
};
