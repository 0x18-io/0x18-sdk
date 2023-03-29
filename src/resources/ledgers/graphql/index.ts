import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import { Ledger, LedgerCreateInput, Mutation } from '../../../gql-types';

export const ledgerCreate = async (ledger: LedgerCreateInput): Promise<Ledger> => {
    let result: Mutation;

    const fields: Array<keyof Ledger> = [
        'avatarUrl',
        'createdAt',
        'description',
        'displayName',
        'id',
        'precision',
        'prefix',
        'reference',
        'suffix',
        'transactionsCount',
        'updatedAt',
        'walletsCount',
        'balance',
    ];

    const { query, variables } = gqlBuilder.mutation(
        {
            operation: 'ledgerCreate',
            fields,
            variables: {
                input: {
                    value: ledger,
                    type: 'LedgerCreateInput',
                    required: true,
                },
            },
        },
        undefined,
        {
            operationName: 'LedgerCreate',
        }
    );

    try {
        result = await Api.getInstance().request(query, variables);
    } catch (error: any) {
        throw new Error(error.response.errors[0].message);
    }

    return result.ledgerCreate;
};
