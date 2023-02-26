import Client from '../';
// @ts-ignore
import process from 'node:process';

const ox = new Client({
    host: 'https://current--org-0x18-qa-api.apollographos.net/graphql',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const { results, pageInfo } = await ox.wallets.findAll({
        first: 1,
    });

    const singleNode = results[0];
    const { id, address } = singleNode;
    console.log(id, address);

    await singleNode.getLedgers();

    console.log(singleNode);
    console.log(singleNode.ledgers[0]);
    console.log(singleNode.ledgers[0].balance.toString());
})();
