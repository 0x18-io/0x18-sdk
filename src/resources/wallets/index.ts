import Api from '../../api';
import {
    WalletsInput,
    IWallets,
    IWalletQuery,
    IWalletQueryOptions,
    IWalletLedgerBalance,
} from './interfaces';
import IConfiguration from '../../configuration/IConfiguration';
import * as gqlBuilder from 'gql-query-builder';
import { PageInfo } from '../constants';

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

    private addProperty(key: string, value: any) {
        Object.defineProperty(this, key, {
            get: () => {
                return value;
            },
        });
    }
}

class Wallet {
    protected data;
    protected cursor;
    constructor(wallet: any) {
        this.data = wallet.node;
        this.cursor = wallet.cursor;

        for (let key in this.data) {
            this.addProperty(key, this.data[key]);
        }
    }

    private addProperty(key: string, value: any) {
        Object.defineProperty(this, key, {
            get: () => {
                return value;
            },
        });
    }

    async getLedgers(): Promise<any> {
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
                        value: { address: this.data.address },
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
                this.data.ledgers = r.wallets.edges[0].node.ledgers.map(
                    (l: any) => new WalletLedgerBalance(l)
                );
                this.addProperty('ledgers', this.data.ledgers);
                return this.data.ledgers;
            });
    }

    get updatedAt() {
        return new Date(this.data.updatedAt);
    }

    get createdAt() {
        return new Date(this.data.createdAt);
    }
}

class Wallets {
    public config: IConfiguration;

    constructor(config: IConfiguration = {}) {
        this.config = config;
    }

    async findAll(input: WalletsInput, options: IWalletQueryOptions = {}) {
        // TODO: If options.attributes is set... put those keys inside node: [] but validate that they are valid keys
        const fields = [
            PageInfo,
            {
                edges: [
                    {
                        node: [
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
                        ],
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
            results: data.wallets.edges.map((edge: any) => new Wallet(edge)),
        };
    }
}

export default Wallets;
