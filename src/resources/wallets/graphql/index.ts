import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import {
    Maybe,
    MessageOnly,
    Mutation,
    Query,
    TransactionsInput,
    Wallet,
    WalletArchiveInput,
    WalletConnection,
    WalletCreateInput,
    WalletLedger,
    WalletLedgerEdge,
    WalletsInput,
    WalletUpdateInput,
} from '../../../gql-types';
import { PageInfoFields } from '../../constants';
import { IPaginatedResponse } from '../../interfaces';
import { Ledger } from '../../ledgers';

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

    const fields = [
        PageInfoFields,
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

export const walletLedgers = async (input: WalletsInput) => {
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

    const fields = [
        PageInfoFields,
        {
            edges: [
                {
                    node: ledgersQuery,
                },
                'cursor',
            ],
        },
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
                                    ledgers: fields,
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

    const walletLedgersGql = result.wallets?.edges?.[0]?.node?.ledgers;

    return <IPaginatedResponse<Ledger>>{
        fetchMore: async (fetchMoreInput: TransactionsInput = {}) => {
            // TODO: Clean up how this works
            if (!fetchMoreInput?.after && !fetchMoreInput?.before) {
                fetchMoreInput.after = walletLedgersGql?.pageInfo?.endCursor;
                fetchMoreInput = { ...fetchMoreInput, ...input };
            }

            return walletLedgers({
                ...(fetchMoreInput ?? input),
            });
        },
        pageInfo: walletLedgersGql?.pageInfo,
        results: walletLedgersGql?.edges?.map((edge: Maybe<WalletLedgerEdge>) =>
            Ledger.build(edge?.node)
        ),
    };
};
