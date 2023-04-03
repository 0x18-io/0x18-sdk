import IConfiguration from '../../../configuration/IConfiguration';
import Wallet from './wallet';
import { WalletEdge, WalletsInput, PageInfo, WalletCreateInput, Maybe } from '../../../gql-types';
import { IWalletQueryOptions, walletCreate, wallets } from '../graphql';

type WalletsResponse = {
    pageInfo: PageInfo;
    results: Wallet[];
    fetchMore: any;
};

class Wallets {
    public config: IConfiguration;

    constructor(config: IConfiguration = {}) {
        this.config = config;
    }

    async create(wallet: WalletCreateInput) {
        const walletGql = await walletCreate(wallet);
        return Wallet.build(walletGql);
    }

    async findOne(input?: WalletsInput, options: IWalletQueryOptions = {}) {
        return this.findAll({ ...input, first: 1 }, options).then(
            (response: WalletsResponse) => response.results?.[0] ?? null
        );
    }

    async findAll(input: WalletsInput, options: IWalletQueryOptions = {}) {
        const walletsGql = await wallets(input, options);

        return <WalletsResponse>{
            fetchMore: async (fetchMoreInput: WalletsInput = {}) => {
                // TODO: Clean up how this works
                if (!fetchMoreInput?.after && !fetchMoreInput?.before) {
                    fetchMoreInput.after = walletsGql?.pageInfo?.endCursor;
                    fetchMoreInput = { ...fetchMoreInput, ...input };
                }

                return this.findAll(
                    {
                        ...(fetchMoreInput ?? input),
                    },
                    options
                );
            },
            pageInfo: walletsGql?.pageInfo,
            results: walletsGql?.edges?.map((edge: Maybe<WalletEdge>) => Wallet.build(edge?.node)),
        };
    }
}

export default Wallets;
