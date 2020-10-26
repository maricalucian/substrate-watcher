const BN = require('bn.js');
const { config } = require('../config');
const moment = require('moment'); // require
const divider = new BN(config.dividend, 10);

const firstEraDay = moment("2019-10-31");

// yeah, this will grow forever... one record a day. so what? :)
const rewardHistoryCache = [];

const getDayFirstEra = (dayText) => {
    const date = moment(dayText);
    const daysSince = date.diff(firstEraDay, 'days');
    return (daysSince * 4 + 3);
}

const getEraReward = async (api, addresses, era) => {
    const lastEraRewardTotal = await api.query.staking.erasValidatorReward(era).then((data) => {
        const totalBn = new BN(data.toString());
        return totalBn.div(divider).toNumber() / 1000;
    });

    const rewardDataLastEra = await api.query.staking.erasRewardPoints(era);
    const rewardPointsLastEra = rewardDataLastEra.get('individual').toJSON();

    const reward = {};

    addresses.forEach((address) => {
        const rewardQuota =
            (rewardPointsLastEra[address] ? rewardPointsLastEra[address] : 0) /
            rewardDataLastEra.get('total').toNumber();
        reward[address] = (lastEraRewardTotal * rewardQuota) / 10;
    });
    return reward;
};

const populateRewardsDay = async (api, addresses, day) => {
    let dayTotal = {};

    const firstEra = getDayFirstEra(day);

    for (let i = 0; i < 4; i++) {
        const reward = await getEraReward(api, addresses, firstEra + i);
        addresses.forEach((address) => {
            if (!dayTotal[address]) {
                dayTotal[address] = 0;
            }
            dayTotal[address] += reward[address];
        });
    }

    let sum = 0;
    addresses.forEach((address) => {
        sum += dayTotal[address];
    });

    dayTotal['total'] = sum;

    rewardHistoryCache[day] = dayTotal;
};

const getDailyReward = async (api, addresses, dayText) => {
    if (!rewardHistoryCache[dayText]) {
        console.log(`fetching daily earning for ${dayText}`);
        await populateRewardsDay(api, addresses, dayText);
    } else {
        console.log(`daily earnings for ${dayText} is in cache`);
    }

    return rewardHistoryCache[dayText];
};

module.exports = {
    getDailyReward,
};
