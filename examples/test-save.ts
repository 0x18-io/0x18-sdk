import Client from '../';
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
            // attributes: ['id', 'address']
        }
    );

    const singleNode = results[0];
    console.log('FIRST FETCH', singleNode);
    console.log(singleNode);
    // TODO: fix
    // @ts-ignore
    singleNode.metadata['test'] = new Date().toISOString();
    console.log('AFTER SETTING METADATA', singleNode);

    console.log('BEGIN SAVING');
    const saved = await singleNode.save();
    // This is for testing race conditions
    // const saved = await Promise.all([singleNode.save(), singleNode.save()]);
    console.log('SAVING DONE', saved);

    console.log('REFETCHING');
    const refetched = await singleNode.refetch();
    console.log('REFETCHING DONE', refetched);
})();
