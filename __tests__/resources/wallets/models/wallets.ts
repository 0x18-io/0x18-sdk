import { describe, expect, test } from '@jest/globals';
import Wallets from '../../../../src/resources/wallets/models/wallets';
import Api from '../../../../src/api';
import nock from 'nock';

const config = {
    host: 'http://somelocalhost',
    apiKey: '0x123',
};
let nockServer: nock.Interceptor;

describe('wallets module', () => {
    beforeAll(() => {
        Api.getInstance().setConfig(config);
        nockServer = nock(config.host).post('/graphql');
    });
    afterAll(() => {
        nock.cleanAll();
    });

    test('findAll success', async () => {
        nockServer.reply(200, {
            data: {
                wallets: {
                    pageInfo: {
                        hasNextPage: true,
                        hasPreviousPage: false,
                        startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                        endCursor: null,
                    },
                    edges: [
                        {
                            cursor: 'YXJyYXljb25uZWN0aW9uOjA=',
                            node: {
                                id: '0x123',
                                reference: 'Testing',
                                description: null,
                                displayName: null,
                                metadata: null,
                                transactionsCount: 0,
                                ledgersCount: 0,
                                createdAt: '2023-03-01T00:00:00.000Z',
                                updatedAt: null,
                            },
                        },
                    ],
                },
            },
        });

        const { pageInfo, results } = await new Wallets(config).findAll({ first: 1 });

        expect(pageInfo.hasNextPage).toEqual(true);
        expect(results[0]).toEqual({
            createdAt: new Date('2023-03-01T00:00:00.000Z'),
            description: null,
            displayName: null,
            id: '0x123',
            ledgersCount: 0,
            metadata: null,
            reference: 'Testing',
            transactionsCount: 0,
            updatedAt: null,
        });
    });
});
