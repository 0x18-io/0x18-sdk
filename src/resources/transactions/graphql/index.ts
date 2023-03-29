import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import {
    Ledger,
    Mutation,
    TransactionCreateItem,
    TransactionCreateResponse,
    TransactionItem,
    TransactionUpdateInput,
} from '../../../gql-types';

export interface ITransactionCreateOptions {
    atomic: boolean;
}

export const transactionCreate = async (
    transactions: TransactionCreateItem[],
    options?: ITransactionCreateOptions
): Promise<TransactionCreateResponse> => {
    let result: Mutation;

    const transactionFields: Array<keyof TransactionItem> = [
        'amount',
        'balance',
        'createdAt',
        'createdAt',
        'errors',
        'id',
        'idempotencyKey',
        'metadata',
        'method',
        'status',
        'tags',
    ];

    const { query, variables } = gqlBuilder.mutation(
        {
            operation: 'transactionCreate',
            fields: [{ transactions: transactionFields }],
            variables: {
                input: {
                    value: {
                        ...options,
                        transactions,
                    },
                    type: 'TransactionCreateInput',
                    required: true,
                },
            },
        },
        undefined,
        {
            operationName: 'TransactionCreate',
        }
    );

    try {
        result = await Api.getInstance().request(query, variables);
    } catch (error: any) {
        throw new Error(error.response.errors[0].message);
    }

    return result.transactionCreate;
};

export const transactionUpdate = async (input: TransactionUpdateInput): Promise<Ledger> => {
    let result: Mutation;

    const fields: Array<keyof Ledger> = ['id'];

    const { query, variables } = gqlBuilder.mutation(
        {
            operation: 'transactionUpdate',
            fields,
            variables: {
                input: {
                    value: input,
                    type: 'TransactionUpdateInput',
                    required: true,
                },
            },
        },
        undefined,
        {
            operationName: 'TransactionUpdate',
        }
    );

    try {
        result = await Api.getInstance().request(query, variables);
    } catch (error: any) {
        throw new Error(error.response.errors[0].message);
    }

    return result.ledgerUpdate;
};
