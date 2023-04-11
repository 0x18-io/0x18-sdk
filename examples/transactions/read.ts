import { Client } from '../..';
// @ts-ignore
import process from 'node:process';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const { results } = await ox.transactions.findAll(
        {
            first: 1,
        },
        {
            // attributes: ['id']
        }
    );

    const singleNode = results[0];

    console.log(singleNode?.id);
    console.log(singleNode?.reference);
    console.log(singleNode?.amount);
    console.log(singleNode?.balance);
    console.log(singleNode?.method);
})();
