import Client from '../';
// @ts-ignore
import process from 'node:process';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const wallet = await ox.wallets.create({
        displayName: 'Hello_from_sdk',
    });

    console.log(wallet);
})();
