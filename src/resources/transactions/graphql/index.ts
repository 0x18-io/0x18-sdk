import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import {
    Mutation,
    TransactionCreateItem,
    TransactionCreateResponse,
    TransactionItem,
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
