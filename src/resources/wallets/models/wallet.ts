import _ from 'lodash';
import Api from '../../../api';
import * as gqlBuilder from 'gql-query-builder';
import WalletLedgerBalance from './wallet-ledger-balance';
import Model from '../../model';
import Semaphore from 'semaphore-async-await';

class Wallet extends Model {
    #dataValues: any;
    #previousDataValues: any;
    #cursor: any;
    #walletsQuery: any;
    #walletsQueryVariables: any;
    #updatableAttributes: string[];
    #updatingSemaphore: Semaphore;

    constructor(wallet: any) {
        super(_.cloneDeep(wallet.node));
        this.#updatableAttributes = ['metadata', 'reference', 'description', 'displayName'];
        this.#updatingSemaphore = new Semaphore(1);

        this.init(wallet, true);
    }

    get defaults(): any {
        return {};
    }

    private init(wallet: any, firstRun = false) {
        this.#previousDataValues = _.cloneDeep(wallet.node);
        this.#dataValues = _.cloneDeep(wallet.node);
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
                address: this.#dataValues.address,
            },
        });
        this.init(data.wallets.edges[0]);
        return this;
    }

    async #saveHttp() {
        const inputValue = {
            metadata: undefined,
            reference: undefined,
            description: undefined,
            displayName: undefined,
        };

        // Do a delta check to only update changed fields
        this.#updatableAttributes.map((key) => {
            const currentValue = _.get(this, key);

            if (!_.isEqual(currentValue, this.#previousDataValues[key])) {
                if (
                    typeof currentValue === 'object' &&
                    JSON.stringify(currentValue) === JSON.stringify({}) &&
                    currentValue === null
                ) {
                    // We skip if the object is empty and was also null before
                    return;
                }

                // @ts-ignore
                inputValue[key] = currentValue;
            }
        });

        // We do not update if nothing has changed
        if (!Object.values(inputValue).filter((x) => x).length) {
            return false;
        }

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

    async getLedgers(): Promise<any> {
        // If operation is already running we do nothing
        // TODO: lets use ID here
        if (!this.#dataValues?.address) {
            return undefined;
        }

        const { query, variables } = gqlBuilder.query(
            {
                operation: 'wallets',
                fields: [
                    {
                        edges: [
                            {
                                node: [
                                    {
                                        ledgers: ['id', 'balance', 'suffix', 'precision'],
                                    },
                                ],
                            },
                        ],
                    },
                ],
                variables: {
                    input: {
                        value: { address: this.#dataValues.address },
                        type: 'WalletsInput',
                        required: true,
                    },
                },
            },
            null,
            {
                operationName: 'WalletBalance',
            }
        );

        return await Api.getInstance()
            .request(query, variables)
            .then((r: any) => {
                // TODO: Simplify
                this.#dataValues.ledgers = r.wallets.edges[0].node.ledgers.map(
                    (l: any) => new WalletLedgerBalance(l)
                );
                // this.addAttributeGetterAndSetters('ledgers', this.dataValues.ledgers);
                return this.#dataValues.ledgers;
            });
    }
}

export default Wallet;
