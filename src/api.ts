import { GraphQLClient, RequestDocument, Variables } from 'graphql-request';
import IConfiguration from './configuration/IConfiguration';

class ApiDecoratorService {
    protected _client: GraphQLClient | undefined;
    private static instance: ApiDecoratorService;
    protected config: IConfiguration | undefined;

    constructor() {}

    public static getInstance(): ApiDecoratorService {
        if (!ApiDecoratorService.instance) {
            ApiDecoratorService.instance = new ApiDecoratorService();
        }

        return ApiDecoratorService.instance;
    }

    public setConfig(config: IConfiguration) {
        if (!this.config) {
            this.config = config;
        }
    }

    get client() {
        if (!this.config) {
            throw new Error('Must set config first.');
        }

        if (!this._client) {
            this._client = new GraphQLClient(`${this.config.host}`, {
                headers: {
                    Authorization: `custom ${this.config.apiKey}`,
                },
            });
        }

        return this._client;
    }

    getNodes(name: string, data: any) {
        return data[name].edges.map((edge: any) => edge.node);
    }

    async request(query: RequestDocument, variables?: Variables) {
        if (!this.client) {
            throw new Error('No client found');
        }

        try {
            return await this.client.request(query, variables);
        } catch (error: any) {
            if (
                error.response.status === 500 &&
                error.response.errors[0].message.includes('invalid hexlify value')
            ) {
                throw new Error('Invalid API key');
            }

            return Promise.reject(error);
        }
    }
}

export default ApiDecoratorService;
