import Client from '../..';
// @ts-ignore
import process from 'node:process';
import Transaction from '../../src/resources/transactions/dto/transaction';
import { TransactionMethods } from '../../src/gql-types';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const tx = await ox.transactions.create(
        new Transaction({
            amount: '100',
            ledgerId: '0xfABDD4b67e3679796760385E2a546798AE6D617D',
            walletId: '0xDF39Aa20066cC4EBa892121cC8177987e15b9b9D',
            method: TransactionMethods.Mint,
        })
    );

    console.log(tx);
})();
