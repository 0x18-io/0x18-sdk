import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import {
    Maybe,
    MessageOnly,
    Mutation,
    PageInfo,
    Query,
    Wallet,
    WalletArchiveInput,
    WalletConnection,
    WalletCreateInput,
    WalletLedger,
    WalletsInput,
    WalletUpdateInput,
} from '../../../gql-types';

// For now we omit nested resources
type WalletAttributes = Omit<Omit<Omit<Wallet, 'ledgers'>, 'auditTrail'>, 'transactions'>;

export interface IWalletQueryOptions {
    attributes?: Array<keyof WalletAttributes>;
}

export const walletCreate = async (wallet: WalletCreateInput): Promise<Wallet> => {
    let result: Mutation;

    const fields: Array<keyof Wallet> = [
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

    const { query, variables } = gqlBuilder.mutation(
        {
            operation: 'walletCreate',
            fields,
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

    return result.walletCreate;
};

export const walletArchive = async (input: WalletArchiveInput): Promise<MessageOnly> => {
    let result: Mutation;

    const fields: Array<keyof MessageOnly> = ['message'];

    const { query, variables } = gqlBuilder.mutation(
        {
            operation: 'walletArchive',
            fields,
            variables: {
                input: {
                    value: input,
                    type: 'WalletArchiveInput',
                    required: true,
                },
            },
        },
        undefined,
        {
            operationName: 'WalletArchive',
        }
    );

    try {
        result = await Api.getInstance().request(query, variables);
    } catch (error: any) {
        throw new Error(error.response.errors[0].message);
    }

    return result.walletArchive;
};

export const walletUpdate = async (input: WalletUpdateInput): Promise<Wallet> => {
    let result: Mutation;

    const fields: Array<keyof Wallet> = ['id'];

    const { query, variables } = gqlBuilder.mutation(
        {
            operation: 'walletUpdate',
            fields,
            variables: {
                input: {
                    value: input,
                    type: 'WalletUpdateInput',
                    required: true,
                },
            },
        },
        undefined,
        {
            operationName: 'WalletUpdate',
        }
    );

    try {
        result = await Api.getInstance().request(query, variables);
    } catch (error: any) {
        throw new Error(error.response.errors[0].message);
    }

    return result.walletUpdate;
};

export const wallets = async (
    input: WalletsInput,
    options: IWalletQueryOptions = {}
): Promise<WalletConnection> => {
    let result: Query;

    const defaultNodeProperties: Array<keyof Wallet> = [
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

    try {
        result = await Api.getInstance().request(query, variables);
    } catch (error: any) {
        throw new Error(error.response.errors[0].message);
    }

    return result.wallets!;
};

export const walletLedgers = async (input: WalletsInput): Promise<Maybe<WalletLedger>[]> => {
    let result: Query;

    const ledgersQuery: Array<keyof WalletLedger> = [
        'id',
        'balance',
        'suffix',
        'avatarUrl',
        'prefix',
        'reference',
        'displayName',
        'description',
        'precision',
    ];

    const { query, variables } = gqlBuilder.query(
        {
            operation: 'wallets',
            fields: [
                {
                    edges: [
                        {
                            node: [
                                {
                                    ledgers: ledgersQuery,
                                },
                            ],
                        },
                    ],
                },
            ],
            variables: {
                input: {
                    value: input,
                    type: 'WalletsInput',
                    required: true,
                },
            },
        },
        null,
        {
            operationName: 'WalletLedger',
        }
    );

    try {
        result = await Api.getInstance().request(query, variables);
    } catch (error: any) {
        throw new Error(error.response.errors[0].message);
    }

    return result?.wallets?.edges?.[0]?.node?.ledgers!;
};
