import { PageInfo as PageInfoGql } from '../gql-types';

interface IPageInfoFields {
    pageInfo: Array<keyof PageInfoGql>;
}

export const PageInfoFields: IPageInfoFields = {
    pageInfo: ['hasNextPage', 'hasPreviousPage', 'startCursor', 'endCursor'],
};
