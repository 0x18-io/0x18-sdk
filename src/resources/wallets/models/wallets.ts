import IConfiguration from '../../../configuration/IConfiguration';
import { PageInfo } from '../../constants';
import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import Wallet, { IWallet } from './wallet';
import { Mutation, WalletCreateInput, WalletEdge, WalletsInput } from '../../../gql-types';

type WalletsResponse = {
    pageInfo: any;
    results: IWallet[];
    fetchMore: any;
};

type WalletAttributes = Omit<Omit<Omit<Wallet, 'ledgers'>, 'auditTrail'>, 'transactions'>;

interface IWalletQueryOptions {
    attributes?: Array<keyof WalletAttributes>;
}

class Wallets {
    public config: IConfiguration;

    constructor(config: IConfiguration = {}) {
        this.config = config;
    }

    async create(input: WalletCreateInput) {
        let result: Mutation;

        const { query, variables } = gqlBuilder.mutation(
            {
                operation: 'walletCreate',
                fields: ['id'],
                variables: {
                    input: {
                        value: { ...input },
                        type: 'WalletCreateInput',
                        required: true,
                    },
                },
            },
            undefined,
            {
                operationName: 'WalletCreate',
            }
        );

        try {
            result = await Api.getInstance().request(query, variables);
        } catch (error: any) {
            throw new Error(error.response.errors[0].message);
        }

        // TODO: refetching is not cool but for now doing to honor NewWallet type
        return this.findOne({ id: result.walletCreate.id });
    }

    async findOne(input: WalletsInput, options: IWalletQueryOptions = {}) {
        return this.findAll({ ...input, first: 1 }, options).then(
            (response: any) => response.results?.[0] ?? null
        );
    }

    async findAll(input: WalletsInput, options: IWalletQueryOptions = {}) {
        // TODO: If options.attributes is set... put those keys inside node: [] but validate that they are valid keys
        const defaultNodeProperties: Array<keyof WalletAttributes> = [
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

        return <WalletsResponse>{
            fetchMore: async (fetchMoreInput: WalletsInput = {}) => {
                // TODO: Clean up how this works
                if (!fetchMoreInput?.after && !fetchMoreInput?.before) {
                    fetchMoreInput.after = data.wallets.pageInfo.endCursor;
                    fetchMoreInput = { ...fetchMoreInput, ...input };
                }

                return this.findAll(
                    {
                        ...(fetchMoreInput ?? input),
                    },
                    options
                );
            },
            pageInfo: data.wallets.pageInfo,
            results: Api.getEdges('wallets', data).map(
                (edge: WalletEdge) =>
                    new Wallet({
                        edge,
                        originalQuery: query,
                        originalQueryVariables: variables,
                    })
            ),
        };
    }
}

export default Wallets;
