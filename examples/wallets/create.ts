import { Client, Wallet } from '../..';
// @ts-ignore
import process from 'node:process';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const wallet = await ox.wallets.create({ displayName: 'Hello_from_sdk' });
    console.log(wallet);
    await wallet.archive();

    const wallet2 = await Wallet.create({ displayName: 'Hello_from_sdk ' });
    console.log(wallet2);
    await wallet2.archive();

    const wallet3 = Wallet.build({ displayName: 'Hello_from_sdk_build' });
    await wallet3.save();
    console.log(wallet3);
    await wallet3.archive();
})();
