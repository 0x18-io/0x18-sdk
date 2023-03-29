import IConfiguration from '../../../configuration/IConfiguration';
import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import Wallet from './wallet';
import {
    Mutation,
    WalletEdge,
    WalletsInput,
    Wallet as WalletGql,
    PageInfo,
    WalletCreateInput,
} from '../../../gql-types';

type WalletsResponse = {
    pageInfo: PageInfo;
    results: Wallet[];
    fetchMore: any;
};

type WalletAttributes = Omit<Omit<Omit<WalletGql, 'ledgers'>, 'auditTrail'>, 'transactions'>;

interface IWalletQueryOptions {
    attributes?: Array<keyof WalletAttributes>;
}

class Wallets {
    public config: IConfiguration;

    constructor(config: IConfiguration = {}) {
        this.config = config;
    }

    async create(wallet: WalletCreateInput) {
        let result: Mutation;

        const { query, variables } = gqlBuilder.mutation(
            {
                operation: 'walletCreate',
                fields: [
                    'id',
                    'reference',
                    'description',
                    'displayName',
                    'metadata',
                    'transactionsCount',
                    'ledgersCount',
                    'createdAt',
                    'updatedAt',
                ],
                variables: {
                    input: {
                        value: wallet,
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

        return Wallet.build(result.walletCreate);
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
            'reference',
            'description',
            'displayName',
            'metadata',
            'transactionsCount',
            'ledgersCount',
            'createdAt',
            'updatedAt',
        ];

        const pageInfo: Array<keyof PageInfo> = [
            'hasNextPage',
            'hasPreviousPage',
            'startCursor',
            'endCursor',
        ];

        const fields = [
            {
                pageInfo,
            },
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
            results: Api.getEdges('wallets', data).map((edge: WalletEdge) =>
                Wallet.build(edge.node)
            ),
        };
    }
}

export default Wallets;
