import _ from 'lodash';
import Api from '../../../api';
import * as gqlBuilder from 'gql-query-builder';
import { Ledger as LedgerGql, LedgerCreateInput as LedgerCreateInputGql } from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, number, object, string, InferType } from 'yup';

export interface INewLedger extends LedgerCreateInputGql {}

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

export interface ILedger extends InferType<typeof ledgerSchema> {
    refetch: () => Promise<any>;
    save: () => Promise<any>;
    archive: () => Promise<any>;
}

class Ledger implements ILedger {
    #dataValues: any;
    #previousDataValues: any;
    #cursor: any;
    #ledgersQuery: any;
    #ledgersQueryVariables: any;
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

    constructor(ledger: INewLedger) {
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

    static build(ledger: LedgerGql): Ledger {
        // this.#cursor = `${ledger.edge.cursor}`;
        const instance = new Ledger(ledger as INewLedger);

        instance.id = ledger.id!;
        instance.transactionsCount = ledger.transactionsCount!;
        instance.walletsCount = ledger.walletsCount!;
        instance.updatedAt = ledger.updatedAt!;
        instance.createdAt = ledger.createdAt!;

        instance.#isNew = false;
        instance.#previousDataValues = ledgerSchema.cast(_.cloneDeep(ledger));
        instance.#dataValues = ledgerSchema.cast(_.cloneDeep(ledger));

        return instance;
    }

    getCursor() {
        return this.#cursor;
    }

    // TODO: just refetch full ledger from api
    async refetch() {
        const data = await Api.getInstance().request(this.#ledgersQuery, {
            input: {
                first: 1,
                id: this.#dataValues.id,
            },
        });

        return Ledger.build(data.ledgers.edges[0]);
    }

    async archive() {
        const { query, variables } = gqlBuilder.mutation(
            {
                operation: 'Archive',
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
            return true;
        } catch (error: any) {
            throw new Error(error.response.errors[0].message);
        }
    }

    async #saveHttp() {
        const inputValue: { [key: string]: any } = {};

        if (this.#isNew) {
            // TODO: call create method
            console.log('Should be creating new ledger');
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
