import Client from '../..';
// @ts-ignore
import process from 'node:process';
import Transaction from '../../src/resources/transactions';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const tx = await ox.transactions.create({
        amount: '100',
        ledgerId: '0xfABDD4b67e3679796760385E2a546798AE6D617D',
        walletId: '0xDF39Aa20066cC4EBa892121cC8177987e15b9b9D',
        method: Transaction.METHODS.MINT,
    });

    console.log(tx);

    const tx2 = await Transaction.create({
        amount: '100',
        ledgerId: '0xfABDD4b67e3679796760385E2a546798AE6D617D',
        walletId: '0xDF39Aa20066cC4EBa892121cC8177987e15b9b9D',
        method: Transaction.METHODS.MINT,
    });

    console.log(tx2);

    const tx3 = Transaction.build({
        amount: '100',
        ledgerId: '0xfABDD4b67e3679796760385E2a546798AE6D617D',
        walletId: '0xDF39Aa20066cC4EBa892121cC8177987e15b9b9D',
        method: Transaction.METHODS.MINT,
    });
    await tx3.save();

    console.log(tx3);
})();
