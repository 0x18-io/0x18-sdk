import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import {
    Ledger,
    Mutation,
    Query,
    Transaction,
    TransactionCreateItem,
    TransactionCreateResponse,
    TransactionItem,
    TransactionsInput,
    TransactionsSearchConnection,
    TransactionUpdateInput,
} from '../../../gql-types';
import { PageInfoFields } from '../../constants';

type TransactionAttributes = Omit<Transaction, 'auditTrail'>;

export interface ITransactionCreateOptions {
    atomic: boolean;
}

export interface ITransactionQueryOptions {
    attributes?: Array<keyof TransactionAttributes>;
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

export const transactions = async (
    input: TransactionsInput,
    options: ITransactionQueryOptions = {}
): Promise<TransactionsSearchConnection> => {
    let result: Query;

    const defaultNodeProperties: Array<keyof TransactionAttributes> = [
        'amount',
        'balance',
        'createdAt',
        'description',
        'errors',
        'hash',
        'id',
        'identity',
        'metadata',
        'method',
        'reference',
        'status',
        'tags',
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
            operation: 'transactions',
            fields,
            variables: {
                input: {
                    value: { ...input },
                    type: 'TransactionsGetInput',
                    required: true,
                },
            },
        },
        null,
        {
            operationName: 'Transactions',
        }
    );

    try {
        result = await Api.getInstance().request(query, variables);
    } catch (error: any) {
        throw new Error(error.response.errors[0].message);
    }

    return result.transactions!;
};
