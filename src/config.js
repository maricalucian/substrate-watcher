const config = {
    addresses: [ 'EkpjJUusZu4FZxzC1EyYxoyCxKVGKAd5aEygoF38tqSv3C3', 'EYLWsnmix2ZYGG1jBedDgUhQQ4cAjpbqH7KvggKYACrBKGr' ],
    dividend: '1000000000',
    // provider: 'wss://kusama-rpc.polkadot.io/',
    provider: 'ws://127.0.0.1:9944/',
    poolingInterval: 120, // seconds
    port: 9311
};

module.exports = {
    config
}