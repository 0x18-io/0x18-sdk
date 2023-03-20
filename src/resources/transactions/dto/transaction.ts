import {
    TransactionCreateItem as TransactionCreateItemGql,
    InputMaybe,
    TransactionMethods,
} from '../../../gql-types';

export interface INewTransaction extends TransactionCreateItemGql {}

class Transaction implements INewTransaction {
    amount: string;
    idempotencyKey?: InputMaybe<string> | undefined;
    ledgerId: string;
    metadata?: any;
    method: TransactionMethods;
    walletId: string;

    constructor(newWallet: TransactionCreateItemGql) {
        this.method = newWallet.method!;
        this.metadata = newWallet.metadata!;
        this.ledgerId = newWallet.ledgerId!;
        this.walletId = newWallet.walletId!;
        this.amount = newWallet.amount!;
    }
}

export default Transaction;
