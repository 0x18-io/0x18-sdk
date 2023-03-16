import Client from '../';
// @ts-ignore
import process from 'node:process';
import Wallet from '../src/resources/wallets/pojo/wallet';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const wallet = await ox.wallets.create(new Wallet({}));
    const wallet2 = await ox.wallets.create({ displayName: 'Hello_from_sdk' });

    console.log(wallet);
    console.log(wallet2);
})();
