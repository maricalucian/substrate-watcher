const getActiveEra = (api) => {
    return api.query.staking.activeEra().then((data) => {
        const ts = data.unwrap().start.toString();
        return {
            activeEra: data.unwrap().index.toNumber(),
            ts,
        };
    });
};


module.exports = {
  getActiveEra
}