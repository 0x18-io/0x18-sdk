import Client from '../..';
// @ts-ignore
import process from 'node:process';
import Ledger from '../../src/resources/ledgers';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const ledger = await ox.ledgers.create(new Ledger({ suffix: 'SDK', precision: 0 }));
    const ledger2 = await ox.ledgers.create({ suffix: 'SDK_2', precision: 0 });
    const ledger3 = new Ledger({ suffix: 'SDK', precision: 0 });
    await ledger3.save();

    console.log(ledger);
    console.log(ledger2);
    console.log(ledger3);

    await ledger.archive();
    await ledger2.archive();
    // await ledger3.archive();
})();
