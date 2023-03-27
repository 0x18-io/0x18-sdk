import _ from 'lodash';
import Api from '../../../api';
import * as gqlBuilder from 'gql-query-builder';
import { Mutation } from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, number, object, string, InferType } from 'yup';
import IModel from '../../model';

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
});

export interface ILedger extends InferType<typeof ledgerSchema> {}

class Ledger implements IModel<ILedger> {
    #dataValues: any;
    #previousDataValues: any;
    #updatableAttributes: string[];
    #updatingSemaphore: Semaphore;
    #isNew: boolean;

    description?: string;
    displayName?: string;
    precision: number;
    prefix?: string;
    suffix: string;
    reference?: string;

    id?: string;
    transactionsCount?: number;
    walletsCount?: number;
    updatedAt?: Date;
    createdAt?: Date;

    private constructor(ledger: any) {
        this.description = ledger.description!;
        this.displayName = ledger.displayName!;
        this.precision = ledger.precision;
        this.prefix = ledger.prefix!;
        this.suffix = ledger.suffix;
        this.reference = ledger.reference!;

        this.#updatableAttributes = [
            'description',
            'displayName',
            'precision',
            'prefix',
            'reference',
            'suffix',
        ];

        this.#updatingSemaphore = new Semaphore(1);
        this.#isNew = true;
        this.#previousDataValues = ledgerSchema.cast(_.cloneDeep(ledger));
        this.#dataValues = ledgerSchema.cast(_.cloneDeep(ledger));
    }

    private init(ledger: any) {
        this.description = ledger.description!;
        this.displayName = ledger.displayName!;
        this.precision = ledger.precision;
        this.prefix = ledger.prefix!;
        this.suffix = ledger.suffix;
        this.reference = ledger.reference!;
        this.id = ledger.id!;
        this.transactionsCount = ledger.transactionsCount!;
        this.walletsCount = ledger.walletsCount!;
        this.updatedAt = ledger.updatedAt!;
        this.createdAt = ledger.createdAt!;

        this.#dataValues = ledgerSchema.cast(_.cloneDeep(ledger));
    }

    static build(ledger: any): Ledger {
        const instance = new Ledger(ledger);

        instance.id = ledger.id!;
        instance.transactionsCount = ledger.transactionsCount!;
        instance.walletsCount = ledger.walletsCount!;
        instance.updatedAt = ledger.updatedAt!;
        instance.createdAt = ledger.createdAt!;

        instance.#previousDataValues = ledgerSchema.cast(_.cloneDeep(ledger));
        instance.#dataValues = ledgerSchema.cast(_.cloneDeep(ledger));

        return instance;
    }

    static async create(ledger: any): Promise<Ledger> {
        // this.#cursor = `${ledger.edge.cursor}`;
        const instance = this.build(ledger);
        await instance.save();
        return instance;
    }

    async archive() {
        const { query, variables } = gqlBuilder.mutation(
            {
                operation: 'ledgerArchive',
                fields: ['message'],
                variables: {
                    input: {
                        value: { id: this.#dataValues.id },
                        type: 'LedgerArchiveInput',
                        required: true,
                    },
                },
            },
            undefined,
            {
                operationName: 'LedgerArchive',
            }
        );

        try {
            await Api.getInstance().request(query, variables);
        } catch (error: any) {
            throw new Error(error.response.errors[0].message);
        }

        return true;
    }

    async #saveHttp() {
        const inputValue: { [key: string]: any } = {};

        if (this.#isNew && !this.id) {
            let result: Mutation;

            const { query, variables } = gqlBuilder.mutation(
                {
                    operation: 'ledgerCreate',
                    fields: [
                        'avatarUrl',
                        'createdAt',
                        'description',
                        'displayName',
                        'id',
                        'precision',
                        'prefix',
                        'reference',
                        'suffix',
                        'transactionsCount',
                        'updatedAt',
                        'walletsCount',
                    ],
                    variables: {
                        input: {
                            value: this,
                            type: 'LedgerCreateInput',
                            required: true,
                        },
                    },
                },
                undefined,
                {
                    operationName: 'LedgerCreate',
                }
            );

            try {
                result = await Api.getInstance().request(query, variables);
            } catch (error: any) {
                throw new Error(error.response.errors[0].message);
            }

            this.init(result.ledgerCreate);
            this.#isNew = false;
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
