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
    }, {
        // attributes: ['id', 'address']
    });

    const singleNode = results[0];
    console.log('FIRST FETCH', singleNode);
    singleNode.metadata.test = 'test231'
    console.log('AFTER SETTING METADATA', singleNode)

    console.log('BEGIN SAVING')
    const saved = await singleNode.save();
    console.log('SAVING DONE', saved)

    console.log('REFETCHING')
    const refetched = await singleNode.refetch()
    console.log('REFETCHING DONE', refetched)
})();
