import Client from '../..';
// @ts-ignore
import process from 'node:process';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const { results, pageInfo } = await ox.wallets.findAll(
        {
            first: 1,
        },
        {
            // attributes: ['id']
        }
    );

    const singleNode = results[0];
    await singleNode.getLedgers();

    console.log(singleNode.id);
    console.log(singleNode.description);
    console.log(singleNode.displayName);
    console.log(singleNode.reference);
    console.log(singleNode.ledgers?.results[0]);
    console.log(singleNode.ledgers?.results[0].balance?.toString());
})();
