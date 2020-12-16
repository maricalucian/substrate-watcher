Stake monitoring on a polkadot/kusama node. Exposes metrics for prometheus scraping.

To run with pm2, clone and then:

```
npm i
npm i pm2@latest -g
npm run server
pm2 startup
pm2 save
```
