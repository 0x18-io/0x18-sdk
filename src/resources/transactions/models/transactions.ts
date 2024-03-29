import IConfiguration from '../../../configuration/IConfiguration';
import {
    TransactionsInput,
    TransactionsGetInput,
    TransactionCreateItem,
    TransactionsSearchEdge,
    Maybe,
} from '../../../gql-types';
import { Transaction } from './transaction';
import {
    ITransactionCreateOptions,
    ITransactionQueryOptions,
    transactionCreate,
    transactions,
} from '../graphql';
import { IPaginatedResponse } from '../../interfaces';

export class Transactions {
    public config: IConfiguration;

    constructor(config: IConfiguration = {}) {
        this.config = config;
    }

    async bulkCreate(
        transactions: TransactionCreateItem[],
        options: ITransactionCreateOptions = { atomic: false }
    ) {
        transactions.forEach((t) => Transaction.validate(t));

        const transactionsGql = await transactionCreate(transactions, options);

        return transactionsGql.transactions.map((t) => Transaction.build(t));
    }

    async create(
        transaction: TransactionCreateItem,
        options: ITransactionCreateOptions = { atomic: false }
    ) {
        Transaction.validate(transaction);

        const transactionsGql = await transactionCreate([transaction], options);

        return Transaction.build(transactionsGql.transactions[0]);
    }

    async findOne(input?: TransactionsGetInput, options: ITransactionQueryOptions = {}) {
        return this.findAll({ ...input, first: 1 }, options).then(
            (response: IPaginatedResponse<Transaction>) => response.results?.[0] ?? null
        );
    }

    async findAll(input: TransactionsInput, options: ITransactionQueryOptions = {}) {
        const transactionsGql = await transactions(input, options);

        return <IPaginatedResponse<Transaction>>{
            fetchMore: async (fetchMoreInput: TransactionsInput = {}) => {
                // TODO: Clean up how this works
                if (!fetchMoreInput?.after && !fetchMoreInput?.before) {
                    fetchMoreInput.after = transactionsGql?.pageInfo?.endCursor;
                    fetchMoreInput = { ...fetchMoreInput, ...input };
                }

                return this.findAll(
                    {
                        ...(fetchMoreInput ?? input),
                    },
                    options
                );
            },
            pageInfo: transactionsGql?.pageInfo,
            results: transactionsGql?.edges?.map((edge: Maybe<TransactionsSearchEdge>) =>
                Transaction.build(edge?.node)
            ),
        };
    }
}
