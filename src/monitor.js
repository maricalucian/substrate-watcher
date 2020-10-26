const { ApiPromise, WsProvider } = require('@polkadot/api');
const { createMetrics } = require('./metrics');
const BN = require('bn.js');
const client = require('prom-client');
const { config } = require('./config');
const moment = require('moment'); // require
const divider = new BN(config.dividend, 10);

// yeah, this will grow forever... on record a day
const rewardHistoryArray = [];

const addresses = config.addresses;

const {
    polkastake_reward_points,
    polkastake_active_era,
    polkastake_staking,
    polkastake_era_reward,
    polkastake_validator_count,
    polkastake_validator_balance,
    polkastake_earning_prev_day
} = createMetrics(client);

const wsProvider = new WsProvider(config.provider);

const startMonitoring = async () => {
    const apiClient = await ApiPromise.create({ provider: wsProvider });

    getData(apiClient);
    setInterval(() => {
        getData(apiClient);
    }, 1000 * config.poolingInterval);
};

const getEraReward = async (api, addresses, era) => {
    const lastEraRewardTotal = await api.query.staking
        .erasValidatorReward(era)
        .then((data) => { 
            const totalBn = new BN(data.toString());
            return totalBn.div(divider).toNumber() / 1000
        });

    const rewardDataLastEra = await api.query.staking.erasRewardPoints(era);
    const rewardPointsLastEra = rewardDataLastEra.get('individual').toJSON();

    const reward = {};

    addresses.forEach(address => {
        const rewardQuota =
            (rewardPointsLastEra[address] ? rewardPointsLastEra[address] : 0) /
            rewardDataLastEra.get('total').toNumber();
        reward[address] = (lastEraRewardTotal * rewardQuota) / 10;    
    })
    return reward;
}

const populateRewardsPreviousDay = async (api, addresses, day, firstEra) => {
    let dayTotal = {};

    for(let i = 0; i < 4; i++) {
        const reward = await getEraReward(api, addresses, firstEra + i);
        addresses.forEach(address => {
            if(!dayTotal[address]) {
                dayTotal[address] = 0;
            } 
            dayTotal[address] += reward[address];
        });
    }

    rewardHistoryArray[day] = dayTotal;
}

const getRewardPointsActiveEra = async (api, activeEra, address) => {
    const rewardData = await api.query.staking.erasRewardPoints(activeEra);
    const rewardPoints = rewardData.get('individual').toJSON();
    polkastake_reward_points.set({ type: 'own', address }, rewardPoints[address] || 0);
    polkastake_reward_points.set({ type: 'total', address }, rewardData.get('total').toNumber());
}

const getStaking = async (api, activeEra, address) => {
    const stakers = await api.query.staking.erasStakers(activeEra, address);
    const stakeValTotal = stakers.get('total').toBn().div(divider).toNumber() / 1000;
    const stakeValOwn = stakers.get('own').toBn().div(divider).toNumber() / 1000;
    polkastake_staking.set({ type: 'own', address }, stakeValOwn);
    polkastake_staking.set({ type: 'total', address }, stakeValTotal);
    polkastake_staking.set({ type: 'others', address }, stakeValTotal - stakeValOwn);
}

const getRewardLastEra = async (api, lastEra, rewardDataLastEra, lastEraRewardTotal, address) => {
    const rewardPointsLastEra = rewardDataLastEra.get('individual').toJSON();
    const rewardQuota =
        (rewardPointsLastEra[address] ? rewardPointsLastEra[address] : 0) /
        rewardDataLastEra.get('total').toNumber();
    polkastake_era_reward.set({ type: 'earning', address }, (lastEraRewardTotal * rewardQuota / 10 ));
    polkastake_era_reward.set({ type: 'own', address }, lastEraRewardTotal * rewardQuota);
    polkastake_era_reward.set({ type: 'total', address }, lastEraRewardTotal);
}

const getData = async (api) => {
    // active era
    const { activeEra, ts } = await api.query.staking.activeEra().then((data) => { 
        const ts = data.unwrap().start.toString();
        return  {
            activeEra: data.unwrap().index.toNumber(),
            ts
        }
    });

    const currentEraDate = moment(parseInt(ts));
    const lastFullDate = moment(currentEraDate);
    const lastDayText = lastFullDate.subtract(1, 'days').format("YYYY-MM-DD");
    
    if (!rewardHistoryArray[lastDayText]) {
        let i = 1;
        while(i <= 4) {
            if(currentEraDate.subtract(6, 'hours').isSameOrBefore(lastDayText, 'day')) {
                break;
            }
            i++;
        }
        
        await populateRewardsPreviousDay(api, addresses, lastDayText, activeEra - i - 3);
    }

    // const { nonce, data: balance } = await api.query.system.account(config.address);

    // polkastake_validator_balance.set({ type: 'free' }, balance.free.div(divider).toNumber() / 1000);
    // polkastake_validator_balance.set({ type: 'frozen' }, balance.miscFrozen.div(divider).toNumber() / 1000);

    const lastEra = activeEra - 1;
    polkastake_active_era.set(activeEra);

    // // // reward points
    addresses.forEach(address => {
        getRewardPointsActiveEra(api, activeEra, address);
    });

    // // // staking
    addresses.forEach(address => {
        getStaking(api, activeEra, address);
    });

    // // last era reward tokens
    const lastEraRewardTotal = await api.query.staking
        .erasValidatorReward(lastEra)
        .then((data) => { 
            const totalBn = new BN(data.toString());
            return totalBn.div(divider).toNumber() / 1000
        });
    const rewardDataLastEra = await api.query.staking.erasRewardPoints(lastEra);
    addresses.forEach(address => {
        getRewardLastEra(api, lastEra, rewardDataLastEra, lastEraRewardTotal, address);
    });

    // // // validators count
    const validatorCount = await api.query.staking.validatorCount().then((data) => data.toNumber());
    polkastake_validator_count.set(validatorCount);


    // reward previous day
    addresses.forEach(address => {
        polkastake_earning_prev_day.set({ address }, rewardHistoryArray[lastDayText][address]);
    });
};

module.exports = {
    startMonitoring,
};
