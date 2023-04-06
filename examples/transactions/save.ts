import { Client } from '../..';
// @ts-ignore
import process from 'node:process';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const { results, pageInfo } = await ox.transactions.findAll(
        {
            first: 1,
        },
        {
            // attributes: ['id']
        }
    );

    const singleNode = results[0];
    console.log('FIRST FETCH', singleNode);
    console.log(singleNode);
    singleNode.reference = 'Hello from SDK';
    console.log('AFTER SETTING REFERENCE', singleNode);

    console.log('BEGIN SAVING');
    const saved = await singleNode.save();
    // This is for testing race conditions
    // const saved = await Promise.all([singleNode.save(), singleNode.save()]);
    console.log('SAVING DONE', saved);
})();
