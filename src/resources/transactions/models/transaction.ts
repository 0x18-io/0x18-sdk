import _ from 'lodash';
import Api from '../../../api';
import * as gqlBuilder from 'gql-query-builder';
import { Mutation, TransactionMethods } from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, object, string, InferType, array, mixed, Maybe } from 'yup';
import IModel from '../../model';

const transactionSchema = object({
    id: string().notRequired(),
    hash: string().notRequired(),
    createdAt: date().notRequired(),
    amount: string().required(),
    balance: string().notRequired(),
    updatedAt: date().notRequired(),
    description: string().notRequired(),
    errors: array().of(string()).notRequired(),
    identity: string().notRequired(),
    metadata: object().notRequired().default({}),
    method: mixed<TransactionMethods>().oneOf(Object.values(TransactionMethods)).required(),
    reference: string().notRequired(),
    status: string().notRequired(),
    tags: array().of(string()).notRequired(),
    ledgerId: string().notRequired(),
    walletId: string().notRequired(),
    idempotencyKey: string().notRequired(),
});

export interface ITransaction extends InferType<typeof transactionSchema> {}

class Transaction implements IModel<ITransaction> {
    #dataValues: any;
    #previousDataValues: any;
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
    ledgerId: string;
    walletId: string;
    idempotencyKey: string;

    private constructor(transaction: any) {
        this.id = transaction.id;
        this.reference = transaction.reference;
        this.description = transaction.description;
        this.updatedAt = transaction.updatedAt;
        this.createdAt = transaction.createdAt;
        this.amount = transaction.amount;
        this.balance = transaction.balance;
        this.metadata = transaction.metadata;
        this.method = transaction.method;
        this.status = transaction.status;
        this.hash = transaction.hash;
        this.tags = transaction.tags;
        this.identity = transaction.identity;
        this.errors = transaction.errors;
        this.ledgerId = transaction.ledgerId;
        this.walletId = transaction.walletId;
        this.idempotencyKey = transaction.idempotencyKey;

        this.#updatableAttributes = ['description', 'reference'];

        this.#updatingSemaphore = new Semaphore(1);
        this.#previousDataValues = transactionSchema.cast(_.cloneDeep(transaction));
        this.#dataValues = transactionSchema.cast(_.cloneDeep(transaction));
    }

    private init(transaction: any) {
        this.id = transaction.id;
        this.reference = transaction.reference;
        this.description = transaction.description;
        this.updatedAt = transaction.updatedAt;
        this.createdAt = transaction.createdAt;
        this.amount = transaction.amount;
        this.balance = transaction.balance;
        this.metadata = transaction.metadata;
        this.method = transaction.method;
        this.status = transaction.status;
        this.hash = transaction.hash;
        this.tags = transaction.tags;
        this.identity = transaction.identity;
        this.errors = transaction.errors;

        this.#dataValues = transactionSchema.cast(_.cloneDeep(transaction));
    }

    public static readonly METHODS = {
        MINT: TransactionMethods.Mint,
        BURN: TransactionMethods.Burn,
    };

    static build(transaction: any): Transaction {
        const instance = new Transaction(transaction);

        instance.id = transaction.id!;
        instance.balance = transaction.balance!;
        instance.tags = transaction.tags!;
        instance.updatedAt = transaction.updatedAt!;
        instance.createdAt = transaction.createdAt!;

        instance.#previousDataValues = transactionSchema.cast(_.cloneDeep(transaction));
        instance.#dataValues = transactionSchema.cast(_.cloneDeep(transaction));

        return instance;
    }

    static async create(transaction: any): Promise<Transaction> {
        const instance = this.build(transaction);
        await instance.save();
        return instance;
    }

    async #saveHttp() {
        const inputValue: { [key: string]: any } = {};

        if (!this.id) {
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
                                transactions: [this],
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

            this.init(result.transactionCreate.transactions[0]);
        } else {
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

    async archive() {
        throw new Error('Archive on transaction is not available');
    }
}

export default Transaction;
