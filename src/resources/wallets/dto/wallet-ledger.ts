import { WalletLedger as WalletLedgerGql } from '../../../gql-types';

class WalletLedger {
    id: string;
    balance: BigInt;
    avatarUrl?: string;
    description?: string;
    displayName?: string;
    precision?: string;
    prefix?: string;
    reference?: string;
    suffix?: string;

    constructor(walletLedger: WalletLedgerGql) {
        this.id = walletLedger.id!;
        this.balance = BigInt(walletLedger.balance!);
        this.avatarUrl = walletLedger.avatarUrl!;
        this.description = walletLedger.description!;
        this.displayName = walletLedger.displayName!;
        this.precision = walletLedger.precision!;
        this.prefix = walletLedger.prefix!;
        this.reference = walletLedger.reference!;
        this.suffix = walletLedger.suffix!;
    }
}

export default WalletLedger;
