import {
    WalletCreateInput as WalletsCreateInputGql,
    InputMaybe,
    Scalars,
} from '../../../gql-types';

export type NewWallet = {
    metadata?: Record<string, string | string[]>;
    displayName?: InputMaybe<Scalars['String']>;
    reference?: InputMaybe<Scalars['String']>;
};

class Wallet implements NewWallet {
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
