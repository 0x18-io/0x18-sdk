import IConfiguration from '../../../configuration/IConfiguration';
import { LedgerCreateInput, LedgersInput, LedgerEdge, PageInfo, Maybe } from '../../../gql-types';
import Ledger from './ledger';
import { ILedgerQueryOptions, ledgerCreate, ledgers } from '../graphql';

type LedgersResponse = {
    pageInfo: PageInfo;
    results: Ledger[];
    fetchMore: any;
};

class Ledgers {
    public config: IConfiguration;

    constructor(config: IConfiguration = {}) {
        this.config = config;
    }

    async create(ledger: LedgerCreateInput) {
        const ledgerGql = await ledgerCreate(ledger);
        return Ledger.build(ledgerGql);
    }

    async findOne(input: LedgersInput, options: ILedgerQueryOptions = {}) {
        return this.findAll({ ...input, first: 1 }, options).then(
            (response: any) => response.results?.[0] ?? null
        );
    }

    async findAll(input: LedgersInput, options: ILedgerQueryOptions = {}) {
        const ledgersGql = await ledgers(input, options);

        return <LedgersResponse>{
            fetchMore: async (fetchMoreInput: LedgersInput = {}) => {
                // TODO: Clean up how this works
                if (!fetchMoreInput?.after && !fetchMoreInput?.before) {
                    fetchMoreInput.after = ledgersGql?.pageInfo?.endCursor;
                    fetchMoreInput = { ...fetchMoreInput, ...input };
                }

                return this.findAll(
                    {
                        ...(fetchMoreInput ?? input),
                    },
                    options
                );
            },
            pageInfo: ledgersGql?.pageInfo,
            results: ledgersGql?.edges?.map((ledger: Maybe<LedgerEdge>) =>
                Ledger.build(ledger?.node)
            ),
        };
    }
}

export default Ledgers;
