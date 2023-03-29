import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import {
    MessageOnly,
    Mutation,
    Wallet,
    WalletArchiveInput,
    WalletCreateInput,
    WalletUpdateInput,
} from '../../../gql-types';

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
