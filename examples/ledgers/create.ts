import { Client, Ledger } from '../..';
// @ts-ignore
import process from 'node:process';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const ledger = await ox.ledgers.create({ suffix: 'SDK', precision: 0 });
    console.log(ledger);
    await ledger.archive();

    const ledger2 = Ledger.build({ precision: 0 });
    ledger2.suffix = 'SDK_2';
    await ledger2.save();

    console.log(ledger2);
    await ledger2.archive();

    const ledger3 = await Ledger.create({ suffix: 'SDK_3', precision: 0 });
    console.log(ledger3);
    await ledger3.archive();
})();
