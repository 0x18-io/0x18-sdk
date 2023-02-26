import Api from '../../api';
import { WalletsInput, IWalletQueryOptions } from './interfaces';
import IConfiguration from '../../configuration/IConfiguration';
import * as gqlBuilder from 'gql-query-builder';
import { PageInfo } from '../constants';
import { enumerable } from '../../utils/decorators';
import { isEqual, cloneDeep } from 'lodash';

class WalletLedgerBalance {
    protected data;
    constructor(balance: any) {
        this.data = balance;

        for (let key in this.data) {
            if (key === 'balance') {
                this.data.balance = BigInt(this.data.balance);
            }

            this.addProperty(key, this.data[key]);
        }
    }

    protected addProperty(key: string, value: any) {
        Object.defineProperty(this, key, {
            get: () => {
                return value;
            },
        });
    }
}

class Wallet {
    @enumerable(false)
    protected dataValues: any;

    @enumerable(false)
    private _previousDataValues: any;

    @enumerable(false)
    protected cursor: any;

    @enumerable(false)
    private walletsQuery: any;

    @enumerable(false)
    private walletsQueryVariables: any;

    constructor(wallet: any) {
        this._previousDataValues = undefined;
        this.walletsQuery = undefined;
        this.walletsQueryVariables = undefined;
        this.dataValues = undefined;
        this.cursor = undefined;
        this.init(wallet, true);
    }

    private init(wallet: any, firstRun = false) {
        this._previousDataValues = cloneDeep(wallet.node);
        this.dataValues = cloneDeep(wallet.node);
        this.walletsQuery = wallet.originalQuery;
        this.walletsQueryVariables = wallet.originalQueryVariables;
        this.cursor = `${wallet.cursor}`;

        for (let key in this.dataValues) {
            // TODO: make this cleaner
            if (['createdAt', 'updatedAt'].includes(key)) {
                this.dataValues[key] = new Date(this.dataValues[key]);
            }

            // Convenience helper for metadata
            if (key === 'metadata' && !this.dataValues[key]) {
                this.dataValues[key] = {};
            }

            this.addProperty(key, this.dataValues[key]);
        }
    }

    private addProperty(key: string, value: any) {
        let attributes = {
            configurable: true,
            get: () => {
                return value;
            },
        };

        if (key === 'metadata') {
            // TODO: Why cant i control the logic for the setter?
            // @ts-ignore
            attributes = {
                ...attributes,
                //@ts-ignore
                set: (val) => {
                    // TODO: This doesnt do anything...
                    this.dataValues[key] = val;
                },
            };
        }

        Object.defineProperty(this, key, attributes);
    }

    async refetch() {
        const data = await Api.getInstance().request(this.walletsQuery, {
            input: {
                first: 1,
                address: this.dataValues.address,
            },
        });
        this.init(data.wallets.edges[0]);
        return this;
    }

    async save() {
        const inputValue = {
            metadata: undefined,
            reference: undefined,
            description: undefined,
            displayName: undefined,
        };

        // Do a delta check to only update changed fields
        Object.keys(inputValue).forEach((key) => {
            // @ts-ignore
            if (!isEqual(this.dataValues[key], this._previousDataValues[key])) {
                if (
                    typeof this.dataValues[key] === 'object' &&
                    JSON.stringify(this.dataValues[key]) === JSON.stringify({}) &&
                    this.dataValues[key] === null
                ) {
                    // We skip if the object is empty and was also null before
                    return;
                }

                // @ts-ignore
                inputValue[key] = this.dataValues[key];
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
                        value: { id: this.dataValues.id, ...inputValue },
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

    async getLedgers(): Promise<any> {
        // TODO: lets use ID here
        if (!this?.dataValues?.address) {
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
                        value: { address: this.dataValues.address },
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

        return Api.getInstance()
            .request(query, variables)
            .then((r: any) => {
                // TODO: Simplify
                this.dataValues.ledgers = r.wallets.edges[0].node.ledgers.map(
                    (l: any) => new WalletLedgerBalance(l)
                );
                this.addProperty('ledgers', this.dataValues.ledgers);
                return this.dataValues.ledgers;
            });
    }
}

class Wallets {
    public config: IConfiguration;

    constructor(config: IConfiguration = {}) {
        this.config = config;
    }

    async findOne(input: WalletsInput, options: IWalletQueryOptions = {}) {
        return this.findAll({ ...input, first: 1 }, options).then(
            (response: any) => response.results?.[0] ?? null
        );
    }

    async findAll(input: WalletsInput, options: IWalletQueryOptions = {}) {
        // TODO: If options.attributes is set... put those keys inside node: [] but validate that they are valid keys
        const defaultNodeProperties = [
            'id',
            'address',
            'reference',
            'description',
            'displayName',
            'metadata',
            'transactionsCount',
            'ledgersCount',
            'createdAt',
            'updatedAt',
        ];

        const fields = [
            PageInfo,
            {
                edges: [
                    {
                        node: options.attributes ?? defaultNodeProperties,
                    },
                    'cursor',
                ],
            },
        ];

        const { query, variables } = gqlBuilder.query(
            {
                operation: 'wallets',
                fields,
                variables: {
                    input: {
                        value: { ...input },
                        type: 'WalletsInput',
                        required: true,
                    },
                },
            },
            null,
            {
                operationName: 'Wallets',
            }
        );

        const data = await Api.getInstance().request(query, variables);

        return {
            pageInfo: data.wallets.pageInfo,
            results: Api.getEdges('wallets', data).map(
                (edge: any) =>
                    new Wallet({
                        ...edge,
                        originalQuery: query,
                        originalQueryVariables: variables,
                    })
            ),
        };
    }
}

export default Wallets;
