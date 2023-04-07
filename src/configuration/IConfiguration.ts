export default interface IConfiguration {
    /**
     * You can set a promise to resolve the API key instead of setting it directly.
     */
    apiKey?: string | (() => Promise<string>);
    host?: string;
    defaultHeaders?: { [key: string]: string };
    numberOfApiCallRetries?: number;
}
