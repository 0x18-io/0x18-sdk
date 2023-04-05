import { PageInfo } from '../gql-types';

export interface IModel<T> {
    save: () => Promise<boolean>;
    archive: () => Promise<boolean> | Promise<void>;
}

export interface IPaginatedResponse<T> {
    pageInfo: PageInfo;
    results: Array<T>;
    fetchMore: any;
}
