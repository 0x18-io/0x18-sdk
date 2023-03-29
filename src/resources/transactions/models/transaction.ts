import _ from 'lodash';
import Api from '../../../api';
import * as gqlBuilder from 'gql-query-builder';
import {
    TransactionCreateItem,
    TransactionItem,
    TransactionMethods,
    TransactionUpdateInput,
} from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, object, string, InferType, array, mixed } from 'yup';
import IModel from '../../model';
import { transactionCreate } from '../graphql';

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
    #updatableAttributes: Array<keyof Omit<TransactionUpdateInput, 'id'>>;
    #updatingSemaphore: Semaphore;

    id?: string;
    hash?: string;
    updatedAt?: Date;
    description?: string;
    errors?: Array<string | undefined> | undefined;
    identity?: string;
    reference?: string;
    tags?: Array<string>;
    createdAt?: Date;
    amount?: string;
    balance?: string;
    metadata: Record<string, string | string[]> = {};
    method?: NonNullable<TransactionMethods | undefined>;
    status?: string;
    ledgerId?: string;
    walletId?: string;
    idempotencyKey?: string;

    private constructor(transaction: Partial<InferType<typeof transactionSchema>>) {
        Object.assign(this, transaction);

        this.#updatableAttributes = ['description', 'reference'];

        this.#updatingSemaphore = new Semaphore(1);
        this.#previousDataValues = transactionSchema.cast(_.cloneDeep(transaction));
        this.#dataValues = transactionSchema.cast(_.cloneDeep(transaction));
    }

    private init(transaction: TransactionItem) {
        Object.assign(this, transaction);

        this.#dataValues = transactionSchema.cast(_.cloneDeep(transaction));
    }

    public static readonly METHODS = {
        MINT: TransactionMethods.Mint,
        BURN: TransactionMethods.Burn,
    };

    static build(transaction: any): Transaction {
        const instance = new Transaction(transaction);

        Object.assign(instance, transaction);

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
            const transactionGql = await transactionCreate([this as TransactionCreateItem]);
            this.init(transactionGql.transactions[0]);
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
        throw new Error('Transaction archive is not available');
    }
}

export default Transaction;
