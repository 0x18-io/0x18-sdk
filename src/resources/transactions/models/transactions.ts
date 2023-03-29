import IConfiguration from '../../../configuration/IConfiguration';
import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import {
    Transaction as TransactionGql,
    TransactionsInput,
    TransactionEdge,
    PageInfo,
    TransactionsGetInput,
    TransactionCreateItem,
} from '../../../gql-types';
import Transaction from './transaction';
import { PageInfoFields } from '../../constants';
import { ITransactionCreateOptions, transactionCreate } from '../graphql';

type TransactionsResponse = {
    pageInfo: PageInfo;
    results: Transaction[];
    fetchMore: any;
};

type TransactionAttributes = Omit<TransactionGql, 'auditTrail'>;

interface ITransactionQueryOptions {
    attributes?: Array<keyof TransactionAttributes>;
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
        const transactionsGql = await transactionCreate(transactions, options);
        return transactionsGql.transactions.map((t) => Transaction.build(t));
    }

    async create(
        transaction: TransactionCreateItem,
        options: ITransactionCreateOptions = { atomic: false }
    ) {
        const transactionsGql = await transactionCreate([transaction], options);
        return Transaction.build(transactionsGql.transactions[0]);
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
