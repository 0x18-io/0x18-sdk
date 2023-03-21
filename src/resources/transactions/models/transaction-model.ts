import _ from 'lodash';
import Api from '../../../api';
import * as gqlBuilder from 'gql-query-builder';
import { TransactionEdge, TransactionMethods } from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, object, string, InferType, array, mixed, Maybe } from 'yup';

const transactionSchema = object({
    id: string().required(),
    hash: string().notRequired(),
    createdAt: date().required(),
    amount: string().required(),
    balance: string().required(),
    updatedAt: date().notRequired(),
    description: string().notRequired(),
    errors: array().of(string()).notRequired(),
    identity: string().notRequired(),
    metadata: object().notRequired().default({}),
    method: mixed<TransactionMethods>().oneOf(Object.values(TransactionMethods)).required(),
    reference: string().notRequired(),
    status: string().required(),
    tags: array().of(string()).notRequired(),
});

export interface ITransaction extends InferType<typeof transactionSchema> {
    refetch: () => Promise<any>;
    save: () => Promise<any>;
}

type NewTransaction = {
    edge: TransactionEdge;
    originalQuery: string;
    originalQueryVariables: any;
};

class TransactionModel implements ITransaction {
    #dataValues: any;
    #previousDataValues: any;
    #cursor: any;
    #transactionsQuery: any;
    #transactionsQueryVariables: any;
    #updatableAttributes: string[];
    #updatingSemaphore: Semaphore;

    hash?: Maybe<string | undefined>;
    updatedAt?: Maybe<Date | undefined>;
    description?: Maybe<string | undefined>;
    errors?: Maybe<(string | undefined)[] | undefined>;
    identity?: Maybe<string | undefined>;
    reference?: Maybe<string | undefined>;
    tags?: Maybe<(string | undefined)[] | undefined>;
    id: string;
    createdAt: Date;
    amount: string;
    balance: string;
    metadata: {} | null;
    method: NonNullable<TransactionMethods | undefined>;
    status: string;

    constructor(transaction: NewTransaction) {
        const transactionCopy = _.defaultsDeep(
            this,
            transactionSchema.cast(_.cloneDeep(transaction.edge.node))
        );
        this.id = transactionCopy.id;
        this.reference = transactionCopy.reference;
        this.description = transactionCopy.description;
        this.updatedAt = transactionCopy.updatedAt;
        this.createdAt = transactionCopy.createdAt;
        this.amount = transactionCopy.amount;
        this.balance = transactionCopy.balance;
        this.metadata = transactionCopy.metadata;
        this.method = transactionCopy.method;
        this.status = transactionCopy.status;
        this.hash = transactionCopy.hash;
        this.tags = transactionCopy.tags;
        this.identity = transactionCopy.identity;
        this.errors = transactionCopy.errors;

        this.#updatableAttributes = ['description', 'reference'];

        this.#updatingSemaphore = new Semaphore(1);

        this.init(transaction, true);
    }

    private init(transaction: NewTransaction, firstRun = false) {
        this.#previousDataValues = transactionSchema.cast(_.cloneDeep(transaction.edge.node));
        this.#dataValues = transactionSchema.cast(_.cloneDeep(transaction.edge.node));
        this.#transactionsQuery = transaction.originalQuery;
        this.#transactionsQueryVariables = transaction.originalQueryVariables;
        this.#cursor = `${transaction.edge.cursor}`;
    }

    getCursor() {
        return this.#cursor;
    }

    async refetch() {
        const data = await Api.getInstance().request(this.#transactionsQuery, {
            input: {
                first: 1,
                id: this.#dataValues.id,
            },
        });
        this.init({
            edge: data.transactions.edges[0],
            originalQuery: this.#transactionsQuery,
            originalQueryVariables: this.#transactionsQuery,
        });
        return this;
    }

    async #saveHttp() {
        const inputValue: { [key: string]: any } = {};

        // Do a delta check to only update changed fields
        this.#updatableAttributes.forEach((key) => {
            const currentValue = _.get(this, key);

            if (_.isEqual(currentValue, this.#previousDataValues[key])) return;
            if (_.isObject(currentValue) && _.isEmpty(currentValue)) return;

            inputValue[key] = currentValue;
        });

        // We do not update if nothing has changed
        if (_.isEmpty(inputValue)) return false;

        const { query, variables } = gqlBuilder.mutation(
            {
                operation: 'transactionUpdate',
                fields: ['id'],
                variables: {
                    input: {
                        value: { id: this.#dataValues.id, ...inputValue },
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
            await Api.getInstance().request(query, variables);
        } catch (error: any) {
            throw new Error(error.response.errors[0].message);
        }

        return true;
    }

    async save() {
        // If operation is already running we do nothing
        const didAcquireLock = await this.#updatingSemaphore.waitFor(0);
        if (!didAcquireLock) {
            return false;
        }

        try {
            return await this.#saveHttp();
        } catch (e) {
            throw e;
        } finally {
            this.#updatingSemaphore.release();
        }
    }
}

export default TransactionModel;
