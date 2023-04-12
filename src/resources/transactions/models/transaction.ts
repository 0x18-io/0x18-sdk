import _ from 'lodash';
import {
    TransactionCreateItem,
    TransactionItem,
    TransactionMethods,
    TransactionUpdateInput,
} from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, object, string, InferType, array, mixed } from 'yup';
import { IModel } from '../../interfaces';
import { transactionCreate, transactionUpdate } from '../graphql';

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
    ledgerId: string().required(),
    walletId: string().required(),
    idempotencyKey: string().notRequired(),
});

export interface ITransaction extends InferType<typeof transactionSchema> {}

export class Transaction implements IModel {
    #updatableAttributes: Array<keyof Omit<TransactionUpdateInput, 'id'>> = [
        'description',
        'reference',
    ];
    #updatingSemaphore: Semaphore = new Semaphore(1);
    #dataValues: any;
    #previousDataValues: any;

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

    private constructor() {}

    static readonly METHODS = {
        MINT: TransactionMethods.Mint,
        BURN: TransactionMethods.Burn,
    };

    static build(transaction: any): Transaction {
        const instance = new Transaction();

        Object.assign(instance, transaction);

        instance.#previousDataValues = _.cloneDeep(transaction);
        instance.#dataValues = _.cloneDeep(transaction);

        return instance;
    }

    static validate(transaction: any) {
        transactionSchema.validateSync(transaction);
    }

    static async create(transaction: any): Promise<Transaction> {
        const instance = this.build(transaction);
        await instance.save();
        return instance;
    }

    #init(transaction: TransactionItem) {
        Object.assign(this, transaction);

        this.#dataValues = transactionSchema.cast(_.cloneDeep(transaction));
    }

    async #saveHttp() {
        const inputValue: { [key: string]: any } = {};

        if (!this.id) {
            const transactionGql = await transactionCreate([this as TransactionCreateItem]);
            this.#init(transactionGql.transactions[0]!);
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

            await transactionUpdate({ id: this.#dataValues.id, ...inputValue });
        }

        return true;
    }

    async save() {
        // If operation is already running we do nothing
        const didAcquireLock = await this.#updatingSemaphore.waitFor(0);

        if (!didAcquireLock) {
            return false;
        }

        Transaction.validate(this);

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
