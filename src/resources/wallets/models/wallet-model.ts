import _ from 'lodash';
import Api from '../../../api';
import * as gqlBuilder from 'gql-query-builder';
import {
    Query,
    WalletEdge,
    WalletsInput,
    WalletLedger as WalletLedgerGql,
} from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, number, object, string, InferType } from 'yup';
import WalletLedger from '../pojo/wallet-ledger';

const walletSchema = object({
    id: string().required(),
    address: string().required(),
    reference: string().notRequired(),
    metadata: object().notRequired().default({}),
    description: string().notRequired(),
    displayName: string().notRequired(),
    transactionsCount: number().notRequired(),
    ledgersCount: number().notRequired(),
    updatedAt: date().notRequired(),
    createdAt: date().required(),
});

export interface IWallet extends InferType<typeof walletSchema> {
    ledgers?: WalletLedger[];
    getLedgers: () => Promise<WalletLedger[] | undefined>;
    refetch: () => Promise<any>;
    save: () => Promise<any>;
}

type NewWallet = {
    edge: WalletEdge;
    originalQuery: string;
    originalQueryVariables: any;
};

class WalletModel implements IWallet {
    #dataValues: any;
    #previousDataValues: any;
    #cursor: any;
    #walletsQuery: any;
    #walletsQueryVariables: any;
    #updatableAttributes: string[];
    #updatingSemaphore: Semaphore;

    id: string;
    address: string;
    reference?: string;
    metadata: Record<string, string | string[]> = {};
    description?: string;
    displayName?: string;
    transactionsCount?: number;
    ledgersCount?: number;
    updatedAt?: Date;
    createdAt: Date;
    ledgers?: WalletLedger[];

    constructor(wallet: NewWallet) {
        const walletCopy = _.defaultsDeep(this, walletSchema.cast(_.cloneDeep(wallet.edge.node)));
        this.id = walletCopy.id;
        this.address = walletCopy.address;
        this.reference = walletCopy.reference;
        this.metadata = walletCopy.metadata || {};
        this.description = walletCopy.description;
        this.displayName = walletCopy.displayName;
        this.transactionsCount = walletCopy.transactionsCount;
        this.ledgersCount = walletCopy.ledgersCount;
        this.updatedAt = walletCopy.updatedAt;
        this.createdAt = walletCopy.createdAt;

        this.#updatableAttributes = ['metadata', 'reference', 'description', 'displayName'];
        this.#updatingSemaphore = new Semaphore(1);

        this.init(wallet, true);
    }

    private init(wallet: NewWallet, firstRun = false) {
        this.#previousDataValues = walletSchema.cast(_.cloneDeep(wallet.edge.node));
        this.#dataValues = walletSchema.cast(_.cloneDeep(wallet.edge.node));
        this.#walletsQuery = wallet.originalQuery;
        this.#walletsQueryVariables = wallet.originalQueryVariables;
        this.#cursor = `${wallet.edge.cursor}`;
    }

    getCursor() {
        return this.#cursor;
    }

    async refetch() {
        const data = await Api.getInstance().request(this.#walletsQuery, {
            input: {
                first: 1,
                id: this.#dataValues.id,
            },
        });
        this.init(data.wallets.edges[0]);
        return this;
    }

    async archive() {
        const { query, variables } = gqlBuilder.mutation(
            {
                operation: 'walletArchive',
                fields: ['message'],
                variables: {
                    input: {
                        value: { id: this.#dataValues.id },
                        type: 'WalletArchiveInput',
                        required: true,
                    },
                },
            },
            undefined,
            {
                operationName: 'WalletArchive',
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
                operation: 'walletUpdate',
                fields: ['id'],
                variables: {
                    input: {
                        value: { id: this.#dataValues.id, ...inputValue },
                        type: 'WalletUpdateInput',
                        required: true,
                    },
                },
            },
            undefined,
            {
                operationName: 'WalletUpdate',
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

    async getLedgers(): Promise<WalletLedger[] | undefined> {
        // If operation is already running we do nothing
        if (!this.#dataValues?.id) {
            return undefined;
        }

        // TODO: lazy load?

        const walletsInput: WalletsInput = { id: this.#dataValues.address };
        const ledgersQuery: Array<keyof WalletLedgerGql> = [
            'id',
            'balance',
            'suffix',
            'avatarUrl',
            'prefix',
            'reference',
            'displayName',
            'description',
            'precision',
        ];

        const { query, variables } = gqlBuilder.query(
            {
                operation: 'wallets',
                fields: [
                    {
                        edges: [
                            {
                                node: [
                                    {
                                        ledgers: ledgersQuery,
                                    },
                                ],
                            },
                        ],
                    },
                ],
                variables: {
                    input: {
                        value: walletsInput,
                        type: 'WalletsInput',
                        required: true,
                    },
                },
            },
            null,
            {
                operationName: 'WalletLedger',
            }
        );

        const walletLedgers: Query = await Api.getInstance().request(query, variables);

        this.#dataValues.ledgers = walletLedgers?.wallets?.edges?.[0]?.node?.ledgers?.map(
            (wl) => new WalletLedger(wl!)
        );

        this.ledgers = this.#dataValues.ledgers;

        return this.#dataValues.ledgers;
    }
}

export default WalletModel;
