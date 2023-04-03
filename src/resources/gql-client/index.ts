import { RequestDocument, Variables } from 'graphql-request';
import Api from '../../api';

export default class GqlClient {
    public async request(query: RequestDocument, variables?: Variables): Promise<any> {
        let result;

        try {
            result = await Api.getInstance().request(query, variables);
        } catch (error: any) {
            throw new Error(error.response.errors[0].message);
        }

        return result;
    }
}
