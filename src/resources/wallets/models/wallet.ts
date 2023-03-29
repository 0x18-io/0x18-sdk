import _ from 'lodash';
import Api from '../../../api';
import * as gqlBuilder from 'gql-query-builder';
import { Query, WalletsInput, WalletLedger as WalletLedgerGql, Mutation } from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, number, object, string, InferType } from 'yup';
import WalletLedger from '../dto/wallet-ledger';
import IModel from '../../model';

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
    ledgers?: WalletLedger[];
}

class Wallet implements IModel<IWallet> {
    #dataValues: any;
    #previousDataValues: any;
    #updatableAttributes: string[];
    #updatingSemaphore: Semaphore;

    id: string;
    reference?: string;
    metadata: Record<string, string | string[]> = {};
    description?: string;
    displayName?: string;
    transactionsCount?: number;
    ledgersCount?: number;
    updatedAt?: Date;
    createdAt: Date;
    ledgers?: WalletLedger[];

    private constructor(wallet: any) {
        this.id = wallet.id;
        this.reference = wallet.reference;
        this.metadata = wallet.metadata || {};
        this.description = wallet.description;
        this.displayName = wallet.displayName;
        this.transactionsCount = wallet.transactionsCount;
        this.ledgersCount = wallet.ledgersCount;
        this.updatedAt = wallet.updatedAt;
        this.createdAt = wallet.createdAt;

        this.#updatableAttributes = ['metadata', 'reference', 'description', 'displayName'];
        this.#updatingSemaphore = new Semaphore(1);

        this.#previousDataValues = walletSchema.cast(_.cloneDeep(wallet));
        this.#dataValues = walletSchema.cast(_.cloneDeep(wallet));
    }

    private init(wallet: any) {
        this.id = wallet.id;
        this.reference = wallet.reference;
        this.metadata = wallet.metadata || {};
        this.description = wallet.description;
        this.displayName = wallet.displayName;
        this.transactionsCount = wallet.transactionsCount;
        this.ledgersCount = wallet.ledgersCount;
        this.updatedAt = wallet.updatedAt;
        this.createdAt = wallet.createdAt;

        this.#dataValues = walletSchema.cast(_.cloneDeep(wallet));
    }

    static build(wallet: any): Wallet {
        const instance = new Wallet(wallet);

        instance.id = wallet.id!;
        instance.transactionsCount = wallet.transactionsCount!;
        instance.ledgersCount = wallet.ledgersCount!;
        instance.updatedAt = wallet.updatedAt!;
        instance.createdAt = wallet.createdAt!;

        instance.#previousDataValues = walletSchema.cast(_.cloneDeep(wallet));
        instance.#dataValues = walletSchema.cast(_.cloneDeep(wallet));

        return instance;
    }

    static async create(wallet: any): Promise<Wallet> {
        const instance = this.build(wallet);
        await instance.save();
        return instance;
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
        } catch (error: any) {
            throw new Error(error.response.errors[0].message);
        }

        return true;
    }

    async #saveHttp() {
        const inputValue: { [key: string]: any } = {};

        if (!this.id) {
            let result: Mutation;

            const { query, variables } = gqlBuilder.mutation(
                {
                    operation: 'walletCreate',
                    fields: [
                        'id',
                        'reference',
                        'description',
                        'displayName',
                        'metadata',
                        'transactionsCount',
                        'ledgersCount',
                        'createdAt',
                        'updatedAt',
                    ],
                    variables: {
                        input: {
                            value: this,
                            type: 'WalletCreateInput',
                            required: true,
                        },
                    },
                },
                undefined,
                {
                    operationName: 'WalletCreate',
                }
            );

            try {
                result = await Api.getInstance().request(query, variables);
            } catch (error: any) {
                throw new Error(error.response.errors[0].message);
            }

            this.init(result.walletCreate);
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

        const walletsInput: WalletsInput = { id: this.#dataValues.id };
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

export default Wallet;
