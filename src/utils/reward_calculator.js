const calculateReward = (ownStake, totalStake, totalReward, percent = 10) => {
    if (totalReward == 0) {
        return 0;
    }

    const myStakeReward = (ownStake / totalStake) * totalReward;
    const commisionReward = (totalReward - myStakeReward) * (percent / 100);

    return myStakeReward + commisionReward;
};

module.exports = {
    calculateReward,
};
