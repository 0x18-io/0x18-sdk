export interface WalletsInput {
    address?: string;
    ledgers?: [string];
    before?: string;
    after?: string;
    first?: number;
    last?: number;
    reverse?: boolean;
    wallets?: [string];
    query?: string;
}

interface IEnumWalletQueryNodeItems extends Array<keyof IWalletQueryNode> {}

export interface IWalletQueryOptions {
    attributes?: IEnumWalletQueryNodeItems;
}

export interface IWalletLedgerBalance {
    id?: string;
    balance?: string;
    suffix?: string;
    precision?: number;
}

export interface IWalletQueryNode {
    id?: string;
    address?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface IWalletQuery {
    pageInfo?: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor?: string;
        endCursor?: string;
    };
    edges?: [
        {
            cursor?: string;
            node?: IWalletQueryNode;
        }
    ];
}

export interface IWallets {
    findAll(input: WalletsInput): Promise<any>;
}
