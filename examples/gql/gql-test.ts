import Client from '../..';
// @ts-ignore
import process from 'node:process';
import Ledger from '../../src/resources/ledgers';
import GqlClient from '../../src/resources/gql-client';

const ox = new Client({
    host: 'https://qa--official0x18.apollographos.net',
    apiKey: `${process.env.OX_API_KEY}`,
});

(async () => {
    const transactions = await ox.gqlClient.request(
        `query Transactions ($input: TransactionsGetInput!)
            { transactions (input: $input) {
                pageInfo {
                    hasNextPage, hasPreviousPage, startCursor, endCursor
                },
                edges {
                    node {
                        amount, balance, createdAt, description, errors, hash, id, identity, metadata, method, reference, status, tags, updatedAt}, cursor
                    }
                }
            }`,
        {
            input: {
                first: 2,
            },
        }
    );

    console.log(JSON.stringify(transactions, null, 2));
})();
