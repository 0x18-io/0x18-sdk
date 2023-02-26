import Api from '../api';

export default interface IConfiguration {
    apiKey?: string;
    host?: string;
    defaultHeaders?: { [key: string]: string };
    numberOfApiCallRetries?: number;
}
