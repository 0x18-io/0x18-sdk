import { inRange } from 'lodash';
import IConfiguration from './configuration/IConfiguration';
import Wallets from './resources/wallets';
import graphqlClient from './api';
import Ledgers from './resources/ledgers';

class Client {
    public config: IConfiguration;

    protected _wallets: Wallets | undefined;
    protected _ledgers: Ledgers | undefined;

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
}

export default Client;
