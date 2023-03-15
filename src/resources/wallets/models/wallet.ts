import _ from 'lodash';
import Api from '../../../api';
import * as gqlBuilder from 'gql-query-builder';
import {
    AuditTrailConnection,
    Maybe,
    Query,
    Scalars,
    TransactionConnection,
    Wallet as WalletType,
    WalletLedger,
    WalletsInput,
} from '../../../gql-types';
import Semaphore from 'semaphore-async-await';
import { date, number, object, string } from 'yup';

const walletSchema = object({
    id: string().required(),
    address: string().required(),
    reference: string().notRequired(),
    metadata: object().notRequired(),
    description: string().notRequired(),
    displayName: string().notRequired(),
    transactionsCount: number().notRequired(),
    ledgersCount: number().notRequired(),
    updatedAt: date().notRequired(),
    createdAt: date().required(),
});

export interface IWallet extends WalletType {
    getLedgers: () => Promise<WalletLedger[] | undefined>;
    refetch: () => Promise<any>;
    save: () => Promise<any>;
}

class Wallet implements IWallet {
    #dataValues: any;
    #previousDataValues: any;
    #cursor: any;
    #walletsQuery: any;
    #walletsQueryVariables: any;
    #updatableAttributes: string[];
    #updatingSemaphore: Semaphore;

    address?: Maybe<Scalars['String']>;
    auditTrail?: Maybe<AuditTrailConnection>;
    createdAt?: Maybe<Scalars['Date']>;
    description?: Maybe<Scalars['String']>;
    displayName?: Maybe<Scalars['String']>;
    id?: Maybe<Scalars['ID']>;
    ledgers?: Maybe<Array<Maybe<WalletLedger>>>;
    ledgersCount?: Maybe<Scalars['Int']>;
    metadata?: Maybe<Scalars['JSON']> = {};
    reference?: Maybe<Scalars['String']>;
    transactions?: Maybe<TransactionConnection>;
    transactionsCount?: Maybe<Scalars['Int']>;
    updatedAt?: Maybe<Scalars['Date']>;

    constructor(wallet: any) {
        _.defaultsDeep(this, walletSchema.cast(_.cloneDeep(wallet.node)));
        this.#updatableAttributes = ['metadata', 'reference', 'description', 'displayName'];
        this.#updatingSemaphore = new Semaphore(1);

        this.init(wallet, true);
    }

    private init(wallet: any, firstRun = false) {
        this.#previousDataValues = walletSchema.cast(_.cloneDeep(wallet.node));
        this.#dataValues = walletSchema.cast(_.cloneDeep(wallet.node));
        this.#walletsQuery = wallet.originalQuery;
        this.#walletsQueryVariables = wallet.originalQueryVariables;
        this.#cursor = `${wallet.cursor}`;
    }

    getCursor() {
        return this.#cursor;
    }

    async refetch() {
        const data = await Api.getInstance().request(this.#walletsQuery, {
            input: {
                first: 1,
                id: this.#dataValues.address,
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
                        value: { address: this.#dataValues.address },
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

        console.log(query);
        console.log(variables);

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
            return this.#saveHttp();
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
        const ledgersQuery: Array<keyof WalletLedger> = [
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

        this.#dataValues.ledgers = walletLedgers?.wallets?.edges?.[0]?.node?.ledgers;
        this.ledgers = this.#dataValues.ledgers;

        return this.#dataValues.ledgers;
    }
}

export default Wallet;
