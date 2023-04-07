export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string;
    String: string;
    Boolean: boolean;
    Int: number;
    Float: number;
    Date: any;
    JSON: any;
    NonEmptyString: any;
};

export type AuditTrail = {
    createdAt?: Maybe<Scalars['Date']>;
    field?: Maybe<Scalars['String']>;
    id?: Maybe<Scalars['ID']>;
    identity?: Maybe<Identity>;
    operation?: Maybe<Scalars['String']>;
    value?: Maybe<Scalars['String']>;
};

export type AuditTrailConnection = {
    edges?: Maybe<Array<Maybe<AuditTrailEdge>>>;
    pageInfo?: Maybe<PageInfo>;
    totalCount?: Maybe<Scalars['Int']>;
};

export type AuditTrailEdge = {
    cursor: Scalars['String'];
    node?: Maybe<AuditTrail>;
};

export type Identity = {
    avatarUrl?: Maybe<Scalars['String']>;
    createdAt?: Maybe<Scalars['Date']>;
    email?: Maybe<Scalars['String']>;
    id?: Maybe<Scalars['ID']>;
    invitedAt?: Maybe<Scalars['Date']>;
    joinedAt?: Maybe<Scalars['Date']>;
    method?: Maybe<IdentityMethod>;
    name?: Maybe<Scalars['String']>;
    org?: Maybe<Scalars['String']>;
    privateKeyPreview?: Maybe<Scalars['String']>;
    publicKey?: Maybe<Scalars['String']>;
    reference?: Maybe<Scalars['String']>;
    role?: Maybe<IdentityRole>;
    status?: Maybe<Scalars['String']>;
    updatedAt?: Maybe<Scalars['Date']>;
};

export enum IdentityMethod {
    Console = 'CONSOLE',
    Programmatic = 'PROGRAMMATIC',
}

export enum IdentityRole {
    Admin = 'ADMIN',
    Member = 'MEMBER',
    Owner = 'OWNER',
}

export type Ledger = {
    auditTrail?: Maybe<AuditTrailConnection>;
    avatarUrl?: Maybe<Scalars['String']>;
    balance?: Maybe<Scalars['String']>;
    createdAt?: Maybe<Scalars['Date']>;
    description?: Maybe<Scalars['String']>;
    displayName?: Maybe<Scalars['String']>;
    id?: Maybe<Scalars['ID']>;
    precision?: Maybe<Scalars['Int']>;
    prefix?: Maybe<Scalars['String']>;
    reference?: Maybe<Scalars['String']>;
    suffix?: Maybe<Scalars['String']>;
    transactionsCount?: Maybe<Scalars['Int']>;
    updatedAt?: Maybe<Scalars['Date']>;
    walletsCount?: Maybe<Scalars['Int']>;
};

export type LedgerArchiveInput = {
    id: Scalars['String'];
};

export type LedgerCreateInput = {
    description?: InputMaybe<Scalars['String']>;
    displayName?: InputMaybe<Scalars['String']>;
    precision: Scalars['Int'];
    prefix?: InputMaybe<Scalars['String']>;
    reference?: InputMaybe<Scalars['String']>;
    suffix: Scalars['String'];
};

export type LedgerEdge = {
    cursor: Scalars['String'];
    node?: Maybe<Ledger>;
};

export type LedgerUpdateInput = {
    description?: InputMaybe<Scalars['String']>;
    displayName?: InputMaybe<Scalars['String']>;
    id: Scalars['String'];
    precision?: InputMaybe<Scalars['Int']>;
    prefix?: InputMaybe<Scalars['String']>;
    reference?: InputMaybe<Scalars['String']>;
    suffix?: InputMaybe<Scalars['String']>;
};

export type LedgersConnection = {
    edges?: Maybe<Array<Maybe<LedgerEdge>>>;
    pageInfo?: Maybe<PageInfo>;
    totalCount?: Maybe<Scalars['Int']>;
};

export type LedgersInput = {
    after?: InputMaybe<Scalars['String']>;
    before?: InputMaybe<Scalars['String']>;
    first?: InputMaybe<Scalars['Int']>;
    id?: InputMaybe<Scalars['String']>;
    ids?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
    last?: InputMaybe<Scalars['Int']>;
    query?: InputMaybe<Scalars['String']>;
    reverse?: InputMaybe<Scalars['Boolean']>;
};

export type Message = {
    message?: Maybe<Scalars['String']>;
};

export type MessageOnly = {
    message?: Maybe<Scalars['String']>;
};

export type Mutation = {
    _empty?: Maybe<Scalars['String']>;
    ledgerArchive: Message;
    ledgerCreate: Ledger;
    ledgerUpdate: Ledger;
    metadataValidate: MessageOnly;
    ruleValidate: MessageOnly;
    transactionCreate: TransactionCreateResponse;
    transactionUpdate: Transaction;
    walletArchive: MessageOnly;
    walletCreate: Wallet;
    walletUpdate: Wallet;
};

export type MutationLedgerArchiveArgs = {
    input: LedgerArchiveInput;
};

export type MutationLedgerCreateArgs = {
    input?: InputMaybe<LedgerCreateInput>;
};

export type MutationLedgerUpdateArgs = {
    input: LedgerUpdateInput;
};

export type MutationMetadataValidateArgs = {
    metadata?: InputMaybe<Scalars['JSON']>;
};

export type MutationRuleValidateArgs = {
    rule?: InputMaybe<Scalars['JSON']>;
};

export type MutationTransactionCreateArgs = {
    input?: InputMaybe<TransactionCreateInput>;
};

export type MutationTransactionUpdateArgs = {
    input?: InputMaybe<TransactionUpdateInput>;
};

export type MutationWalletArchiveArgs = {
    input: WalletArchiveInput;
};

export type MutationWalletCreateArgs = {
    input?: InputMaybe<WalletCreateInput>;
};

export type MutationWalletUpdateArgs = {
    input: WalletUpdateInput;
};

export type PageInfo = {
    endCursor?: Maybe<Scalars['String']>;
    hasNextPage: Scalars['Boolean'];
    hasPreviousPage: Scalars['Boolean'];
    startCursor?: Maybe<Scalars['String']>;
};

export type Query = {
    _service: _Service;
    ledgers?: Maybe<LedgersConnection>;
    transactions?: Maybe<TransactionsSearchConnection>;
    wallets?: Maybe<WalletConnection>;
    welcome?: Maybe<Scalars['String']>;
};

export type QueryLedgersArgs = {
    input?: InputMaybe<LedgersInput>;
};

export type QueryTransactionsArgs = {
    input?: InputMaybe<TransactionsGetInput>;
};

export type QueryWalletsArgs = {
    input?: InputMaybe<WalletsInput>;
};

export type Transaction = {
    amount?: Maybe<Scalars['String']>;
    auditTrail?: Maybe<AuditTrailConnection>;
    balance?: Maybe<Scalars['String']>;
    createdAt?: Maybe<Scalars['Date']>;
    description?: Maybe<Scalars['String']>;
    errors?: Maybe<Array<Maybe<Scalars['String']>>>;
    hash?: Maybe<Scalars['String']>;
    id?: Maybe<Scalars['ID']>;
    identity?: Maybe<Scalars['String']>;
    ledger?: Maybe<Ledger>;
    metadata?: Maybe<Scalars['JSON']>;
    method: TransactionMethods;
    reference?: Maybe<Scalars['String']>;
    status?: Maybe<Scalars['String']>;
    tags?: Maybe<Array<Maybe<Scalars['String']>>>;
    updatedAt?: Maybe<Scalars['Date']>;
    wallet?: Maybe<Wallet>;
};

export type TransactionConnection = {
    edges?: Maybe<Array<Maybe<TransactionEdge>>>;
    pageInfo?: Maybe<PageInfo>;
    totalCount?: Maybe<Scalars['Int']>;
};

export type TransactionCreateInput = {
    atomic?: InputMaybe<Scalars['Boolean']>;
    transactions: Array<TransactionCreateItem>;
};

export type TransactionCreateItem = {
    amount: Scalars['NonEmptyString'];
    description?: InputMaybe<Scalars['String']>;
    idempotencyKey?: InputMaybe<Scalars['NonEmptyString']>;
    ledgerId: Scalars['NonEmptyString'];
    metadata?: InputMaybe<Scalars['JSON']>;
    method: TransactionMethods;
    reference?: InputMaybe<Scalars['String']>;
    walletId: Scalars['NonEmptyString'];
};

export type TransactionCreateResponse = {
    atomic?: Maybe<Scalars['Boolean']>;
    transactions: Array<TransactionItem>;
};

export type TransactionEdge = {
    cursor: Scalars['String'];
    node?: Maybe<WalletTransaction>;
};

export type TransactionItem = {
    amount: Scalars['String'];
    balance?: Maybe<Scalars['String']>;
    createdAt?: Maybe<Scalars['Date']>;
    description?: Maybe<Scalars['String']>;
    errors?: Maybe<Array<Maybe<Scalars['String']>>>;
    id?: Maybe<Scalars['ID']>;
    idempotencyKey?: Maybe<Scalars['String']>;
    ledgerId: Scalars['String'];
    metadata?: Maybe<Scalars['JSON']>;
    method: TransactionMethods;
    reference?: Maybe<Scalars['String']>;
    status: TransactionStatus;
    tags?: Maybe<Array<Maybe<Scalars['String']>>>;
    walletId: Scalars['String'];
};

export enum TransactionMethods {
    Burn = 'burn',
    Mint = 'mint',
}

export enum TransactionStatus {
    Cancelled = 'cancelled',
    Failed = 'failed',
    Success = 'success',
}

export type TransactionUpdateInput = {
    description?: InputMaybe<Scalars['String']>;
    id: Scalars['ID'];
    metadata?: InputMaybe<Scalars['JSON']>;
    reference?: InputMaybe<Scalars['String']>;
};

export type TransactionsGetInput = {
    after?: InputMaybe<Scalars['String']>;
    before?: InputMaybe<Scalars['String']>;
    first?: InputMaybe<Scalars['Int']>;
    id?: InputMaybe<Scalars['String']>;
    idempotencyKey?: InputMaybe<Scalars['String']>;
    ids?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
    includeBurn?: InputMaybe<Scalars['Boolean']>;
    includeMint?: InputMaybe<Scalars['Boolean']>;
    last?: InputMaybe<Scalars['Int']>;
    ledgerIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
    reverse?: InputMaybe<Scalars['Boolean']>;
    statuses?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
    tags?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
    walletIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
};

export type TransactionsInput = {
    after?: InputMaybe<Scalars['String']>;
    before?: InputMaybe<Scalars['String']>;
    first?: InputMaybe<Scalars['Int']>;
    last?: InputMaybe<Scalars['Int']>;
    ledger?: InputMaybe<Scalars['String']>;
    reverse?: InputMaybe<Scalars['Boolean']>;
};

export type TransactionsSearchConnection = {
    edges?: Maybe<Array<Maybe<TransactionsSearchEdge>>>;
    pageInfo?: Maybe<PageInfo>;
    totalCount?: Maybe<Scalars['Int']>;
};

export type TransactionsSearchEdge = {
    cursor: Scalars['String'];
    node?: Maybe<Transaction>;
};

export type Wallet = {
    auditTrail?: Maybe<AuditTrailConnection>;
    createdAt?: Maybe<Scalars['Date']>;
    description?: Maybe<Scalars['String']>;
    displayName?: Maybe<Scalars['String']>;
    id?: Maybe<Scalars['ID']>;
    ledgers?: Maybe<WalletLedgerConnection>;
    ledgersCount?: Maybe<Scalars['Int']>;
    metadata?: Maybe<Scalars['JSON']>;
    reference?: Maybe<Scalars['String']>;
    transactions?: Maybe<TransactionConnection>;
    transactionsCount?: Maybe<Scalars['Int']>;
    updatedAt?: Maybe<Scalars['Date']>;
};

export type WalletLedgersArgs = {
    input?: InputMaybe<WalletLedgersInput>;
};

export type WalletTransactionsArgs = {
    input?: InputMaybe<TransactionsInput>;
};

export type WalletArchiveInput = {
    id: Scalars['String'];
};

export type WalletConnection = {
    edges?: Maybe<Array<Maybe<WalletEdge>>>;
    pageInfo?: Maybe<PageInfo>;
    totalCount?: Maybe<Scalars['Int']>;
};

export type WalletCreateInput = {
    displayName?: InputMaybe<Scalars['String']>;
    metadata?: InputMaybe<Scalars['JSON']>;
    reference?: InputMaybe<Scalars['String']>;
};

export type WalletEdge = {
    cursor: Scalars['String'];
    node?: Maybe<Wallet>;
};

export type WalletLedger = {
    avatarUrl?: Maybe<Scalars['String']>;
    balance?: Maybe<Scalars['String']>;
    description?: Maybe<Scalars['String']>;
    displayName?: Maybe<Scalars['String']>;
    id?: Maybe<Scalars['ID']>;
    precision?: Maybe<Scalars['String']>;
    prefix?: Maybe<Scalars['String']>;
    reference?: Maybe<Scalars['String']>;
    suffix?: Maybe<Scalars['String']>;
};

export type WalletLedgerConnection = {
    edges?: Maybe<Array<Maybe<WalletLedgerEdge>>>;
    pageInfo?: Maybe<PageInfo>;
    totalCount?: Maybe<Scalars['Int']>;
};

export type WalletLedgerEdge = {
    cursor: Scalars['String'];
    node?: Maybe<WalletLedger>;
};

export type WalletLedgersInput = {
    after?: InputMaybe<Scalars['String']>;
    before?: InputMaybe<Scalars['String']>;
    first?: InputMaybe<Scalars['Int']>;
    last?: InputMaybe<Scalars['Int']>;
    ledgerId?: InputMaybe<Scalars['String']>;
    ledgerIds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
    reverse?: InputMaybe<Scalars['Boolean']>;
};

export type WalletTransaction = {
    amount?: Maybe<Scalars['String']>;
    createdAt?: Maybe<Scalars['Date']>;
    hash?: Maybe<Scalars['String']>;
    id?: Maybe<Scalars['String']>;
    identity?: Maybe<Scalars['String']>;
    ledger?: Maybe<Scalars['String']>;
    method?: Maybe<Scalars['String']>;
    status?: Maybe<Scalars['String']>;
    updatedAt?: Maybe<Scalars['Date']>;
};

export type WalletUpdateInput = {
    description?: InputMaybe<Scalars['String']>;
    displayName?: InputMaybe<Scalars['String']>;
    id: Scalars['ID'];
    metadata?: InputMaybe<Scalars['JSON']>;
    reference?: InputMaybe<Scalars['String']>;
};

export type WalletsInput = {
    after?: InputMaybe<Scalars['String']>;
    before?: InputMaybe<Scalars['String']>;
    first?: InputMaybe<Scalars['Int']>;
    id?: InputMaybe<Scalars['String']>;
    ids?: InputMaybe<Array<InputMaybe<Scalars['String']>>>;
    last?: InputMaybe<Scalars['Int']>;
    query?: InputMaybe<Scalars['String']>;
    reverse?: InputMaybe<Scalars['Boolean']>;
};

export type _Service = {
    sdl?: Maybe<Scalars['String']>;
};
