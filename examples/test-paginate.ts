import Client from '../';
// @ts-ignore
import process from 'node:process';

const ox = new Client({
    host: 'https://current--org-0x18-qa-api.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    let { results, pageInfo, fetchMore } = await ox.wallets.findAll({
        first: 1,
    });

    // @ts-ignore
    console.log(results, pageInfo);

    ({ results, pageInfo, fetchMore } = await fetchMore());

    console.log(results, pageInfo);
})();
