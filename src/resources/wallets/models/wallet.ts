import _ from 'lodash';
import Api from '../../../api';
import * as gqlBuilder from 'gql-query-builder';
import { Query, WalletsInput, WalletLedger as WalletLedgerGql } from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, number, object, string, InferType } from 'yup';
import WalletLedger from '../dto/wallet-ledger';
import IModel from '../../model';
import { walletArchive, walletCreate, walletUpdate } from '../graphql';

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

    id?: string;
    reference?: string;
    metadata: Record<string, string | string[]> = {};
    description?: string;
    displayName?: string;
    transactionsCount?: number;
    ledgersCount?: number;
    updatedAt?: Date;
    createdAt?: Date;
    ledgers?: WalletLedger[];

    private constructor(wallet: any) {
        Object.assign(this, wallet);

        this.#updatableAttributes = ['metadata', 'reference', 'description', 'displayName'];
        this.#updatingSemaphore = new Semaphore(1);

        this.#previousDataValues = walletSchema.cast(_.cloneDeep(wallet));
        this.#dataValues = walletSchema.cast(_.cloneDeep(wallet));
    }

    private init(wallet: any) {
        Object.assign(this, wallet);

        this.#dataValues = walletSchema.cast(_.cloneDeep(wallet));
    }

    static build(wallet: any): Wallet {
        const instance = new Wallet(wallet);

        Object.assign(instance, wallet);

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
        await walletArchive({ id: this.#dataValues.id });
        return true;
    }

    async #saveHttp() {
        const inputValue: { [key: string]: any } = {};

        if (!this.id) {
            const walletGql = await walletCreate(this);
            this.init(walletGql);
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
