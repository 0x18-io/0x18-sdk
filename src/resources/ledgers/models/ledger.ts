import _ from 'lodash';
import { LedgerUpdateInput, LedgerCreateInput } from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, number, object, string, InferType } from 'yup';
import { IModel } from '../../interfaces';
import { ledgerArchive, ledgerCreate, ledgerUpdate } from '../graphql';

const ledgerSchema = object({
    id: string().notRequired(),
    description: string().notRequired(),
    displayName: string().notRequired(),
    precision: number().integer().required(),
    prefix: string().notRequired(),
    reference: string().notRequired(),
    suffix: string().required(),
    transactionsCount: number().integer().notRequired(),
    walletsCount: number().integer().notRequired(),
    updatedAt: date().notRequired(),
    createdAt: date().notRequired(),
    balance: string().notRequired(),
    avatarUrl: string().notRequired(),
});

export interface ILedger extends InferType<typeof ledgerSchema> {}

export class Ledger implements IModel {
    #updatableAttributes: Omit<Array<keyof LedgerUpdateInput>, 'id'> = [
        'description',
        'displayName',
        'precision',
        'prefix',
        'reference',
        'suffix',
    ];
    #updatingSemaphore: Semaphore = new Semaphore(1);
    #dataValues: any;
    #previousDataValues: any;

    id?: string;
    transactionsCount?: number;
    walletsCount?: number;
    updatedAt?: Date;
    createdAt?: Date;
    description?: string;
    displayName?: string;
    precision?: number;
    prefix?: string;
    suffix?: string;
    reference?: string;
    avatarUrl?: string;
    balance?: string;

    private constructor() {}

    static build(ledger: any): Ledger {
        const instance = new Ledger();
        Object.assign(instance, ledger);

        instance.#previousDataValues = _.cloneDeep(ledger);
        instance.#dataValues = _.cloneDeep(ledger);

        return instance;
    }

    static validate(ledger: any) {
        ledgerSchema.validateSync(ledger);
    }

    static async create(ledger: any): Promise<Ledger> {
        const instance = this.build(ledger);
        await instance.save();
        return instance;
    }

    #init(ledger: any) {
        Object.assign(this, ledger);

        this.#dataValues = ledgerSchema.cast(_.cloneDeep(ledger));
    }

    async #saveHttp() {
        const inputValue: { [key: string]: any } = {};

        if (!this.id) {
            const ledgerGql = await ledgerCreate(this as LedgerCreateInput);

            this.#init(ledgerGql);
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

            await ledgerUpdate({ id: this.#dataValues.id, ...inputValue });
        }

        return true;
    }

    async save() {
        // If operation is already running we do nothing
        const didAcquireLock = await this.#updatingSemaphore.waitFor(0);

        if (!didAcquireLock) {
            return false;
        }

        // Call validate before saving
        Ledger.validate(this);

        try {
            return await this.#saveHttp();
        } catch (e) {
            throw e;
        } finally {
            this.#updatingSemaphore.release();
        }
    }

    async archive() {
        await ledgerArchive({ id: this.#dataValues.id });
        return true;
    }
}
