const BN = require('bn.js');
const { config } = require('../config');
const moment = require('moment'); // require
const divider = new BN(config.dividend, 10);
const { calculateReward } = require('../utils/reward_calculator');

const firstEraDay = moment(config.firstEraDay);

// yeah, this will grow forever... one record a day. so what? :)
const rewardHistoryCache = [];

const getDayFirstEra = (dayText) => {
    const date = moment(dayText);
    const daysSince = date.diff(firstEraDay, 'days');
    return (daysSince * config.erasPerDay + config.offset);
}

const getEraReward = async (api, addresses, era) => {
    const lastEraRewardTotal = await api.query.staking.erasValidatorReward(era).then((data) => {
        const totalBn = new BN(data.toString());
        return totalBn.div(divider).toNumber() / 1000;
    });

    const rewardDataLastEra = await api.query.staking.erasRewardPoints(era);
    const rewardPointsLastEra = rewardDataLastEra.get('individual').toJSON();

    const reward = {};

    for (const address of addresses) {
        const stakers = await api.query.staking.erasStakers(era, address);
        const stakeValTotal = stakers.get('total').toBn().div(divider).toNumber() / 1000;
        const stakeValOwn = stakers.get('own').toBn().div(divider).toNumber() / 1000;

        const rewardQuota =
            (rewardPointsLastEra[address] ? rewardPointsLastEra[address] : 0) /
            rewardDataLastEra.get('total').toNumber();
        reward[address] = calculateReward(stakeValOwn, stakeValTotal, lastEraRewardTotal * rewardQuota, config.percent);
    }
    return reward;
};

const populateRewardsDay = async (api, addresses, day) => {
    let dayTotal = {};

    const firstEra = getDayFirstEra(day);

    for (let i = 0; i < config.erasPerDay; i++) {
        const reward = await getEraReward(api, addresses, firstEra + i);
        addresses.forEach((address) => {
            if (!dayTotal[address]) {
                dayTotal[address] = 0;
            }
            dayTotal[address] += reward[address];
        });
    }

    let sum = {};
    const totalGroups = [];
    addresses.forEach((address) => {
        if(config.total_group[address]) {
            if(!sum[config.total_group[address]]){
                sum[config.total_group[address]] = 0;
            }

            sum[config.total_group[address]] += dayTotal[address];

            if(!totalGroups.includes(config.total_group[address])){
                totalGroups.push(config.total_group[address]);
            }
        }
    });

    totalGroups.forEach(g => {
        dayTotal[`total_${g}`] = sum[g];
    })

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
