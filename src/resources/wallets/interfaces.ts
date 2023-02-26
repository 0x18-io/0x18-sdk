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

export interface IWalletQueryOptions {
    attributes?: any;
}

export interface IWalletLedgerBalance {
    id?: string;
    balance?: string;
    suffix?: string;
    precision?: number;
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
            node?: {
                id?: string;
                address?: string;
                createdAt?: string;
                updatedAt?: string;
                ledgers?: [
                    {
                        id?: string;
                        balance?: string;
                        suffix?: string;
                        precision?: number;
                    }
                ];
            };
        }
    ];
}

export interface IWallets {
    findAll(input: WalletsInput): Promise<any>;
}
