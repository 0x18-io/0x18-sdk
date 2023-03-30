import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import {
    Ledger,
    LedgerArchiveInput,
    LedgerCreateInput,
    LedgersConnection,
    LedgersInput,
    LedgerUpdateInput,
    MessageOnly,
    Mutation,
    Query,
} from '../../../gql-types';
import { PageInfoFields } from '../../constants';

type LedgerAttributes = Omit<Ledger, 'auditTrail'>;

export interface ILedgerQueryOptions {
    attributes?: Array<keyof LedgerAttributes>;
}

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

export const ledgerArchive = async (input: LedgerArchiveInput): Promise<MessageOnly> => {
    let result: Mutation;

    const fields: Array<keyof MessageOnly> = ['message'];

    const { query, variables } = gqlBuilder.mutation(
        {
            operation: 'ledgerArchive',
            fields,
            variables: {
                input: {
                    value: input,
                    type: 'LedgerArchiveInput',
                    required: true,
                },
            },
        },
        undefined,
        {
            operationName: 'LedgerArchive',
        }
    );

    try {
        result = await Api.getInstance().request(query, variables);
    } catch (error: any) {
        throw new Error(error.response.errors[0].message);
    }

    return result.ledgerArchive;
};

export const ledgerUpdate = async (input: LedgerUpdateInput) => {
    let result: Mutation;

    const fields: Array<keyof Ledger> = ['id'];

    const { query, variables } = gqlBuilder.mutation(
        {
            operation: 'ledgerUpdate',
            fields,
            variables: {
                input: {
                    value: input,
                    type: 'LedgerUpdateInput',
                    required: true,
                },
            },
        },
        undefined,
        {
            operationName: 'LedgerUpdate',
        }
    );

    try {
        result = await Api.getInstance().request(query, variables);
    } catch (error: any) {
        throw new Error(error.response.errors[0].message);
    }

    return result.ledgerUpdate;
};

export const ledgers = async (
    input: LedgersInput,
    options: ILedgerQueryOptions = {}
): Promise<LedgersConnection> => {
    let result: Query;

    const defaultNodeProperties: Array<keyof LedgerAttributes> = [
        'id',
        'createdAt',
        'description',
        'displayName',
        'precision',
        'prefix',
        'reference',
        'suffix',
        'transactionsCount',
        'updatedAt',
        'walletsCount',
    ];

    const fields = [
        PageInfoFields,
        {
            edges: [
                {
                    node: options.attributes ?? defaultNodeProperties,
                },
                'cursor',
            ],
        },
    ];

    const { query, variables } = gqlBuilder.query(
        {
            operation: 'ledgers',
            fields,
            variables: {
                input: {
                    value: { ...input },
                    type: 'LedgersInput',
                    required: true,
                },
            },
        },
        null,
        {
            operationName: 'Ledgers',
        }
    );

    try {
        result = await Api.getInstance().request(query, variables);
    } catch (error: any) {
        throw new Error(error.response.errors[0].message);
    }

    return result.ledgers!;
};
