import { InputMaybe, LedgerCreateInput as LedgerCreateInputGql, Scalars } from '../../../gql-types';

export type NewLedger = {
    displayName?: InputMaybe<Scalars['String']>;
    precision?: InputMaybe<Scalars['Int']>;
    prefix?: InputMaybe<Scalars['String']>;
    reference?: InputMaybe<Scalars['String']>;
    suffix: Scalars['String'];
};

class Ledger implements NewLedger {
    displayName?: InputMaybe<string> | undefined;
    precision?: InputMaybe<number> | undefined;
    prefix?: InputMaybe<string> | undefined;
    reference?: InputMaybe<string> | undefined;
    suffix: string;

    constructor(newLedger: LedgerCreateInputGql) {
        this.displayName = newLedger.displayName!;
        this.precision = newLedger.precision!;
        this.prefix = newLedger.prefix!;
        this.reference = newLedger.reference!;
        this.suffix = newLedger.suffix!;
    }
}
