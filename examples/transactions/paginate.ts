import Client from '../..';
// @ts-ignore
import process from 'node:process';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    let { results, pageInfo, fetchMore } = await ox.transactions.findAll({
        first: 1,
    });

    // @ts-ignore
    console.log(results, pageInfo);

    ({ results, pageInfo, fetchMore } = await fetchMore());

    console.log(results, pageInfo);
})();
