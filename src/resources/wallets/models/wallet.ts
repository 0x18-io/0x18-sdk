import _ from 'lodash';
import Semaphore from 'semaphore-async-await';
import { date, number, object, string, InferType } from 'yup';
import { IModel, IPaginatedResponse } from '../../interfaces';
import { walletArchive, walletCreate, walletLedgers, walletUpdate } from '../graphql';
import { Ledger } from '../../ledgers';
import { WalletUpdateInput } from '../../../gql-types';

const walletSchema = object({
    id: string().notRequired(),
    reference: string().notRequired(),
    metadata: object().notRequired().default({}),
    description: string().notRequired(),
    displayName: string().notRequired(),
    transactionsCount: number().notRequired(),
    ledgersCount: number().notRequired(),
    updatedAt: date().notRequired(),
    createdAt: date().notRequired(),
});

export interface IWallet extends InferType<typeof walletSchema> {
    ledgers?: Ledger[];
}

export class Wallet implements IModel {
    #updatableAttributes: Omit<Array<keyof WalletUpdateInput>, 'id'> = [
        'metadata',
        'reference',
        'description',
        'displayName',
    ];
    #updatingSemaphore: Semaphore = new Semaphore(1);
    #dataValues: any;
    #previousDataValues: any;

    id?: string;
    reference?: string;
    metadata: Record<string, string | string[]> = {};
    description?: string;
    displayName?: string;
    transactionsCount?: number;
    ledgersCount?: number;
    updatedAt?: Date;
    createdAt?: Date;
    ledgers?: IPaginatedResponse<Ledger>;

    private constructor() {}

    #init(wallet: any) {
        Object.assign(this, wallet);

        this.#dataValues = walletSchema.cast(_.cloneDeep(wallet));
    }

    static build(wallet: any): Wallet {
        const instance = new Wallet();

        Object.assign(instance, wallet);

        instance.#previousDataValues = _.cloneDeep(wallet);
        instance.#dataValues = _.cloneDeep(wallet);

        return instance;
    }

    static validate(wallet: any) {
        walletSchema.validateSync(wallet);
    }

    static async create(wallet: any): Promise<Wallet> {
        const instance = this.build(wallet);
        await instance.save();
        return instance;
    }

    async #saveHttp() {
        const inputValue: { [key: string]: any } = {};

        if (!this.id) {
            const walletGql = await walletCreate(this);
            this.#init(walletGql);
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

            await walletUpdate({ id: this.#dataValues.id, ...inputValue });
        }

        return true;
    }

    async save() {
        // If operation is already running we do nothing
        const didAcquireLock = await this.#updatingSemaphore.waitFor(0);

        if (!didAcquireLock) {
            return false;
        }

        Wallet.validate(this);

        try {
            return await this.#saveHttp();
        } catch (e) {
            throw e;
        } finally {
            this.#updatingSemaphore.release();
        }
    }

    async archive() {
        await walletArchive({ id: this.#dataValues.id });
        return true;
    }

    async getLedgers(): Promise<IPaginatedResponse<Ledger> | undefined> {
        // If operation is already running we do nothing
        if (!this.#dataValues?.id) {
            return undefined;
        }

        // TODO: lazy load?
        this.#dataValues.ledgers = await walletLedgers({ id: this.#dataValues.id });

        this.ledgers = this.#dataValues.ledgers;

        return this.#dataValues.ledgers;
    }
}
