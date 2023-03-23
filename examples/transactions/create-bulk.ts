import Client from '../..';
// @ts-ignore
import process from 'node:process';
import Transaction from '../../src/resources/transactions/dto/transaction';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const txs = await ox.transactions.bulkCreate([
        new Transaction({
            amount: '100',
            ledgerId: '0xfABDD4b67e3679796760385E2a546798AE6D617D',
            walletId: '0xDF39Aa20066cC4EBa892121cC8177987e15b9b9D',
            method: Transaction.METHODS.MINT,
        }),
        new Transaction({
            amount: '100',
            ledgerId: '0xfABDD4b67e3679796760385E2a546798AE6D617D',
            walletId: '0xDF39Aa20066cC4EBa892121cC8177987e15b9b9D',
            method: Transaction.METHODS.BURN,
        }),
    ]);

    console.log(txs);
})();