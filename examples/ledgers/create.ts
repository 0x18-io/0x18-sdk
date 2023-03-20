import Client from '../..';
// @ts-ignore
import process from 'node:process';
import Ledger from '../../src/resources/ledgers/pojo/ledger';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const ledger = await ox.ledgers.create(new Ledger({ suffix: 'SDK', precision: 0 }));
    const ledger2 = await ox.ledgers.create({ suffix: 'SDK_2', precision: 0 });

    console.log(ledger);
    console.log(ledger2);
})();
