import _ from 'lodash';
import Api from '../../../api';
import * as gqlBuilder from 'gql-query-builder';
import { LedgersEdge } from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, number, object, string, InferType } from 'yup';

const ledgerSchema = object({
    id: string().required(),
    description: string().notRequired(),
    displayName: string().notRequired(),
    precision: number().integer().required(),
    prefix: string().notRequired(),
    reference: string().notRequired(),
    suffix: string().required(),
    transactionsCount: number().integer().notRequired(),
    walletsCount: number().integer().notRequired(),
    updatedAt: date().notRequired(),
    createdAt: date().required(),
});

export interface ILedger extends InferType<typeof ledgerSchema> {
    refetch: () => Promise<any>;
    save: () => Promise<any>;
}

type NewLedger = {
    edge: LedgersEdge;
    originalQuery: string;
    originalQueryVariables: any;
};

class LedgerModel implements ILedger {
    #dataValues: any;
    #previousDataValues: any;
    #cursor: any;
    #ledgersQuery: any;
    #ledgersQueryVariables: any;
    #updatableAttributes: string[];
    #updatingSemaphore: Semaphore;

    id: string;
    description?: string;
    displayName?: string;
    precision: number;
    prefix?: string;
    reference?: string;
    suffix: string;
    transactionsCount?: number;
    walletsCount?: number;
    updatedAt?: Date;
    createdAt: Date;

    constructor(ledger: NewLedger) {
        const ledgerCopy = _.defaultsDeep(this, ledgerSchema.cast(_.cloneDeep(ledger.edge.node)));
        this.id = ledgerCopy.id;
        this.precision = ledgerCopy.precision;
        this.reference = ledgerCopy.reference;
        this.description = ledgerCopy.description;
        this.displayName = ledgerCopy.displayName;
        this.transactionsCount = ledgerCopy.transactionsCount;
        this.suffix = ledgerCopy.suffix;
        this.updatedAt = ledgerCopy.updatedAt;
        this.createdAt = ledgerCopy.createdAt;

        this.#updatableAttributes = [
            'description',
            'displayName',
            'precision',
            'prefix',
            'reference',
            'suffix',
        ];

        this.#updatingSemaphore = new Semaphore(1);

        this.init(ledger, true);
    }

    private init(ledger: NewLedger, firstRun = false) {
        this.#previousDataValues = ledgerSchema.cast(_.cloneDeep(ledger.edge.node));
        this.#dataValues = ledgerSchema.cast(_.cloneDeep(ledger.edge.node));
        this.#ledgersQuery = ledger.originalQuery;
        this.#ledgersQueryVariables = ledger.originalQueryVariables;
        this.#cursor = `${ledger.edge.cursor}`;
    }

    getCursor() {
        return this.#cursor;
    }

    async refetch() {
        const data = await Api.getInstance().request(this.#ledgersQuery, {
            input: {
                first: 1,
                id: this.#dataValues.id,
            },
        });
        this.init(data.ledgers.edges[0]);
        return this;
    }

    async archive() {
        const { query, variables } = gqlBuilder.mutation(
            {
                operation: 'Archive',
                fields: ['message'],
                variables: {
                    input: {
                        value: { ledgerId: this.#dataValues.id },
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

export default LedgerModel;
