import Client from '../..';
// @ts-ignore
import process from 'node:process';
import Ledger from '../../src/resources/ledgers';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const ledger = await ox.ledgers.create(Ledger.build({ suffix: 'SDK', precision: 0 }));
    console.log(ledger);
    await ledger.archive();

    const ledger2 = await ox.ledgers.create({ suffix: 'SDK_2', precision: 0 });
    console.log(ledger2);
    await ledger2.archive();

    const ledger3 = Ledger.build({ suffix: 'SDK', precision: 0 });
    await ledger3.save();

    console.log(ledger3);
    await ledger3.archive();

    const ledger4 = await Ledger.create({ suffix: 'SDK', precision: 0 });
    console.log(ledger4);
    await ledger4.archive();
})();
