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
