import { InputMaybe, LedgerCreateInput as LedgerCreateInputGql } from '../../../gql-types';

export interface INewLedger extends LedgerCreateInputGql {}

class Ledger implements INewLedger {
    description?: InputMaybe<string> | undefined;
    displayName?: InputMaybe<string> | undefined;
    precision: number;
    prefix?: InputMaybe<string> | undefined;
    reference?: InputMaybe<string> | undefined;
    suffix: string;

    constructor(newLedger: LedgerCreateInputGql) {
        this.displayName = newLedger.displayName!;
        this.description = newLedger.description!;
        this.precision = newLedger.precision!;
        this.prefix = newLedger.prefix!;
        this.reference = newLedger.reference!;
        this.suffix = newLedger.suffix!;
    }
}

export default Ledger;
