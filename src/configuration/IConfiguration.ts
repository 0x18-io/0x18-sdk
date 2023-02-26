export default interface IConfiguration {
    apiKey?: string;
    /**
     * You can set a promise to resolve the API key instead of setting it directly.
     */
    apiKeyPromise?: Promise<string>;
    host?: string;
    defaultHeaders?: { [key: string]: string };
    numberOfApiCallRetries?: number;
}
