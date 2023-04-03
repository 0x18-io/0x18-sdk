import { inRange } from 'lodash';
import IConfiguration from './configuration/IConfiguration';
import Wallets from './resources/wallets/models/wallets';
import graphqlClient from './api';
import Ledgers from './resources/ledgers/models/ledgers';
import Transactions from './resources/transactions/models/transactions';
import GqlClient from './resources/gql-client';

class Client {
    public config: IConfiguration;

    protected _wallets: Wallets | undefined;
    protected _ledgers: Ledgers | undefined;
    protected _transactions: Transactions | undefined;
    protected _gqlClient: GqlClient | undefined;

    constructor(config: IConfiguration = {}) {
        const defaultOptions = {
            host: 'https://api.0x18.io',
            numberOfApiCallRetries: 0,
        };
        this.config = { ...defaultOptions, ...config };
        this.init();
    }
    public init() {
        if (
            this.config.numberOfApiCallRetries &&
            !inRange(this.config.numberOfApiCallRetries, 0, 6)
        ) {
            throw new Error('numberOfApiCallRetries can be set to a number from 0 - 6.');
        }
        graphqlClient.getInstance().setConfig(this.config);

        this._wallets = undefined;
    }

    /**
     * Getter
     * @returns Wallets
     */
    get wallets() {
        if (!this._wallets) this._wallets = new Wallets(this.config);

        return this._wallets;
    }

    /**
     * Getter
     * @returns Ledgers
     */
    get ledgers() {
        if (!this._ledgers) this._ledgers = new Ledgers(this.config);

        return this._ledgers;
    }

    /**
     * Getter
     * @returns Transactions
     */
    get transactions() {
        if (!this._transactions) this._transactions = new Transactions(this.config);

        return this._transactions;
    }

    /**
     * Getter
     * @returns GqlClient
     */
    get gqlClient(): GqlClient {
        if (!this._gqlClient) this._gqlClient = new GqlClient();

        return this._gqlClient;
    }
}

export default Client;
