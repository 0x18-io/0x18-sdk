import IConfiguration from '../../../configuration/IConfiguration';
import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import {
    Mutation,
    Transaction as TransactionGql,
    TransactionsInput,
    TransactionEdge,
    PageInfo,
    TransactionsGetInput,
    TransactionItem,
    TransactionCreateItem,
} from '../../../gql-types';
import Transaction from './transaction';
import { PageInfoFields } from '../../constants';

type TransactionsResponse = {
    pageInfo: PageInfo;
    results: Transaction[];
    fetchMore: any;
};

type TransactionAttributes = Omit<TransactionGql, 'auditTrail'>;

interface ITransactionQueryOptions {
    attributes?: Array<keyof TransactionAttributes>;
}

interface ITransactionCreateOptions {
    atomic: boolean;
}

class Transactions {
    public config: IConfiguration;

    constructor(config: IConfiguration = {}) {
        this.config = config;
    }

    async bulkCreate(
        transactions: TransactionCreateItem[],
        options: ITransactionCreateOptions = { atomic: false }
    ) {
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

        return result.transactionCreate.transactions.map((t) => Transaction.build(t));
    }

    async create(transaction: TransactionCreateItem) {
        let result: Mutation;

        const { query, variables } = gqlBuilder.mutation(
            {
                operation: 'transactionCreate',
                fields: [
                    {
                        transactions: [
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
                        ],
                    },
                ],
                variables: {
                    input: {
                        value: {
                            atomic: false,
                            transactions: [transaction],
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

        return Transaction.build(result.transactionCreate.transactions[0]);
    }

    async findOne(input: TransactionsGetInput, options: ITransactionQueryOptions = {}) {
        return this.findAll({ ...input, first: 1 }, options).then(
            (response: any) => response.results?.[0] ?? null
        );
    }

    async findAll(input: TransactionsInput, options: ITransactionQueryOptions = {}) {
        // TODO: If options.attributes is set... put those keys inside node: [] but validate that they are valid keys
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

        // TODO: create a type for this
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

        const data = await Api.getInstance().request(query, variables);

        return <TransactionsResponse>{
            fetchMore: async (fetchMoreInput: TransactionsInput = {}) => {
                // TODO: Clean up how this works
                if (!fetchMoreInput?.after && !fetchMoreInput?.before) {
                    fetchMoreInput.after = data.transactions.pageInfo.endCursor;
                    fetchMoreInput = { ...fetchMoreInput, ...input };
                }

                return this.findAll(
                    {
                        ...(fetchMoreInput ?? input),
                    },
                    options
                );
            },
            pageInfo: data.transactions.pageInfo,
            results: Api.getEdges('transactions', data).map((edge: TransactionEdge) =>
                Transaction.build(edge.node)
            ),
        };
    }
}

export default Transactions;
