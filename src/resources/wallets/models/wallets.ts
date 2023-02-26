import IConfiguration from '../../../configuration/IConfiguration';
import { IWalletQueryOptions, WalletsInput } from '../interfaces';
import { PageInfo } from '../../constants';
import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import Wallet from './wallet';

class Wallets {
    public config: IConfiguration;

    constructor(config: IConfiguration = {}) {
        this.config = config;
    }

    async findOne(input: WalletsInput, options: IWalletQueryOptions = {}) {
        return this.findAll({ ...input, first: 1 }, options).then(
            (response: any) => response.results?.[0] ?? null
        );
    }

    async findAll(input: WalletsInput, options: IWalletQueryOptions = {}) {
        // TODO: If options.attributes is set... put those keys inside node: [] but validate that they are valid keys
        const defaultNodeProperties = [
            'id',
            'address',
            'reference',
            'description',
            'displayName',
            'metadata',
            'transactionsCount',
            'ledgersCount',
            'createdAt',
            'updatedAt',
        ];

        const fields = [
            PageInfo,
            {
                edges: [
                    {
                        node: options.attributes ?? defaultNodeProperties,
                    },
                    'cursor',
                ],
            },
        ];

        const { query, variables } = gqlBuilder.query(
            {
                operation: 'wallets',
                fields,
                variables: {
                    input: {
                        value: { ...input },
                        type: 'WalletsInput',
                        required: true,
                    },
                },
            },
            null,
            {
                operationName: 'Wallets',
            }
        );

        const data = await Api.getInstance().request(query, variables);

        return {
            pageInfo: data.wallets.pageInfo,
            results: Api.getEdges('wallets', data).map(
                (edge: any) =>
                    new Wallet({
                        ...edge,
                        originalQuery: query,
                        originalQueryVariables: variables,
                    })
            ),
        };
    }
}

export default Wallets;
