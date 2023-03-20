import {
    WalletCreateInput as WalletsCreateInputGql,
    InputMaybe,
    Scalars,
} from '../../../gql-types';

export interface INewWallet extends WalletsCreateInputGql {}

class Wallet implements INewWallet {
    metadata: Record<string, string | string[]> = {};
    displayName?: InputMaybe<Scalars['String']>;
    reference?: InputMaybe<Scalars['String']>;

    constructor(newWallet: WalletsCreateInputGql) {
        this.displayName = newWallet.displayName!;
        this.metadata = newWallet.metadata!;
        this.reference = newWallet.reference!;
    }
}

export default Wallet;
