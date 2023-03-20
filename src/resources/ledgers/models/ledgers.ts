import IConfiguration from '../../../configuration/IConfiguration';
import * as gqlBuilder from 'gql-query-builder';
import Api from '../../../api';
import {
    Mutation,
    Ledger as LedgerGql,
    LedgersInput,
    LedgerEdge,
    PageInfo,
} from '../../../gql-types';
import { INewLedger } from '../dto/ledger';
import LedgerModel, { ILedger } from './ledger-model';
import { PageInfoFields } from '../../constants';

type LedgersResponse = {
    pageInfo: PageInfo;
    results: ILedger[];
    fetchMore: any;
};

type LedgerAttributes = Omit<LedgerGql, 'auditTrail'>;

interface ILedgerQueryOptions {
    attributes?: Array<keyof LedgerAttributes>;
}

class Ledgers {
    public config: IConfiguration;

    constructor(config: IConfiguration = {}) {
        this.config = config;
    }

    async create(ledger: INewLedger) {
        let result: Mutation;

        const { query, variables } = gqlBuilder.mutation(
            {
                operation: 'ledgerCreate',
                fields: ['id'],
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

        // TODO: refetching is not cool but for now doing to honor NewLedger type
        return this.findOne({ id: result.ledgerCreate.id });
    }

    async findOne(input: LedgersInput, options: ILedgerQueryOptions = {}) {
        return this.findAll({ ...input, first: 1 }, options).then(
            (response: any) => response.results?.[0] ?? null
        );
    }

    async findAll(input: LedgersInput, options: ILedgerQueryOptions = {}) {
        // TODO: If options.attributes is set... put those keys inside node: [] but validate that they are valid keys
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

        // TODO: create a type for this
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

        const data = await Api.getInstance().request(query, variables);

        return <LedgersResponse>{
            fetchMore: async (fetchMoreInput: LedgersInput = {}) => {
                // TODO: Clean up how this works
                if (!fetchMoreInput?.after && !fetchMoreInput?.before) {
                    fetchMoreInput.after = data.ledgers.pageInfo.endCursor;
                    fetchMoreInput = { ...fetchMoreInput, ...input };
                }

                return this.findAll(
                    {
                        ...(fetchMoreInput ?? input),
                    },
                    options
                );
            },
            pageInfo: data.ledgers.pageInfo,
            results: Api.getEdges('ledgers', data).map(
                (edge: LedgerEdge) =>
                    new LedgerModel({
                        edge,
                        originalQuery: query,
                        originalQueryVariables: variables,
                    })
            ),
        };
    }
}

export default Ledgers;
