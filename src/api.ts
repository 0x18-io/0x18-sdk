import { GraphQLClient, RequestDocument, Variables } from 'graphql-request';
import IConfiguration from './configuration/IConfiguration';
import sleep from './utils/sleep';

class ApiDecoratorService {
    private static instance: ApiDecoratorService;

    protected _client: GraphQLClient | undefined;
    protected config: IConfiguration | undefined;

    static getInstance(): ApiDecoratorService {
        if (!ApiDecoratorService.instance) {
            ApiDecoratorService.instance = new ApiDecoratorService();
        }

        return ApiDecoratorService.instance;
    }

    static getEdges(name: string, data: any) {
        return data[name].edges;
    }

    static getNodes(name: string, data: any) {
        return data[name].edges.map((e: any) => e.node);
    }

    async #apiKeyMiddleware(request: RequestInit) {
        // @ts-ignore
        const token = await this.config.apiKeyPromise();

        return {
            ...request,
            headers: { ...request.headers, Authorization: `custom ${token}` },
        };
    }

    async #requestWithRetry(
        requestPromise: Promise<any>,
        { retries = 3, everyMs = 1000 },
        retriesCount = 0
    ): Promise<any> {
        try {
            return await requestPromise;
        } catch (e) {
            const updatedCount = retriesCount + 1;
            if (updatedCount > retries) {
                throw e;
            }
            await sleep(everyMs);
            return await this.#requestWithRetry(requestPromise, { retries, everyMs }, updatedCount);
        }
    }

    setConfig(config: IConfiguration) {
        if (!this.config) {
            this.config = config;
        }
    }

    async request(query: RequestDocument, variables?: Variables) {
        if (!this.client) {
            throw new Error('No client found');
        }

        try {
            return await this.#requestWithRetry(this.client.request(query, variables), {
                retries: this.config?.numberOfApiCallRetries
                    ? this.config.numberOfApiCallRetries
                    : 0,
            });
        } catch (error: any) {
            return Promise.reject(error);
        }
    }

    get client() {
        if (!this.config) {
            throw new Error('Must set config first.');
        }

        if (!this._client) {
            const clientOptions = {
                headers: {
                    Authorization: `custom ${this.config.apiKey}`,
                },
            };

            if (this.config.apiKeyPromise) {
                // @ts-ignore
                clientOptions.requestMiddleware = this.#apiKeyMiddleware;
            }

            this._client = new GraphQLClient(`${this.config.host}/graphql`, clientOptions);
        }

        return this._client;
    }
}

export default ApiDecoratorService;
