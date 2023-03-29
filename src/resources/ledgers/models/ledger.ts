import _ from 'lodash';
import Api from '../../../api';
import * as gqlBuilder from 'gql-query-builder';
import { LedgerUpdateInput, LedgerCreateInput } from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, number, object, string, InferType } from 'yup';
import IModel from '../../model';
import { ledgerArchive, ledgerCreate } from '../graphql';

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
});

export interface ILedger extends InferType<typeof ledgerSchema> {}

class Ledger implements IModel<ILedger> {
    #dataValues: any;
    #previousDataValues: any;
    #updatableAttributes: Omit<Array<keyof LedgerUpdateInput>, 'id'>;
    #updatingSemaphore: Semaphore;

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

    private constructor(ledger: any) {
        Object.assign(this, ledger);

        this.#updatableAttributes = [
            'description',
            'displayName',
            'precision',
            'prefix',
            'reference',
            'suffix',
        ];

        this.#updatingSemaphore = new Semaphore(1);
        this.#previousDataValues = ledgerSchema.cast(_.cloneDeep(ledger));
        this.#dataValues = ledgerSchema.cast(_.cloneDeep(ledger));
    }

    private init(ledger: any) {
        Object.assign(this, ledger);

        this.#dataValues = ledgerSchema.cast(_.cloneDeep(ledger));
    }

    static build(ledger: any): Ledger {
        const instance = new Ledger(ledger);

        Object.assign(instance, ledger);

        instance.#previousDataValues = ledgerSchema.cast(_.cloneDeep(ledger));
        instance.#dataValues = ledgerSchema.cast(_.cloneDeep(ledger));

        return instance;
    }

    static async create(ledger: any): Promise<Ledger> {
        const instance = this.build(ledger);
        await instance.save();
        return instance;
    }

    async archive() {
        await ledgerArchive({ id: this.#dataValues.id });
        return true;
    }

    async #saveHttp() {
        const inputValue: { [key: string]: any } = {};

        if (!this.id) {
            const ledgerGql = await ledgerCreate(this as LedgerCreateInput);

            this.init(ledgerGql);
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
                    operation: 'ledgerUpdate',
                    fields: ['id'],
                    variables: {
                        input: {
                            value: { id: this.#dataValues.id, ...inputValue },
                            type: 'LedgerUpdateInput',
                            required: true,
                        },
                    },
                },
                undefined,
                {
                    operationName: 'LedgerUpdate',
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
}

export default Ledger;
