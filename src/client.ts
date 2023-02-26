import Api from './api';
import { gql } from 'graphql-request';
import IConfiguration from './configuration/IConfiguration';
import Wallets from './resources/wallets';
import graphqlClient from './api';

class Client {
    public config: IConfiguration;

    protected _wallets: Wallets | undefined;

    constructor(config: IConfiguration = {}) {
        const defaultOptions = {
            endpoint: 'https://api.0x18.io/graphql',
        };
        this.config = { ...defaultOptions, ...config };
        this.init();
    }
    public init() {
        const decorators = [];
        if (this.config.numberOfApiCallRetries && this.config.numberOfApiCallRetries > 0) {
            if (this.config.numberOfApiCallRetries > 6) {
                throw new Error('numberOfApiCallRetries can be set to a number from 0 - 6.');
            }
            // decorators.push(new RetryDecorator(this.config.numberOfApiCallRetries));
        }
        // ApiDecoratorService.getInstance().setDecorators(decorators);
        graphqlClient.getInstance().setConfig(this.config);

        this._wallets = undefined;
    }

    /**
     * Getter
     * @returns Wallets
     */
    get wallets() {
        if (!this._wallets) {
            this._wallets = new Wallets(this.config);
        }
        return this._wallets;
    }
}

export default Client;
