# 0x18-sdk

0x18 SDK library provides a convenient way to work with 0x18 API.

## Documentation

More documentation about specific features can be found in official documentation page [here](https://docs.0x18.io/).

## Installing

```
npm i @official-0x18/sdk
```

## Instantiate Client

To use SDK client has to be always initialized. It is configured using your organization API key, that you can find in the hex panel.

```javascript
const { Client } = require('@official-0x18/sdk');

const ox = new Client({ apiKey: <org-api-key> });
```

For ES modules

```javascript
import { Client } from '@official-0x18/sdk';

const ox = new Client({ apiKey: <org-api-key> });
```

Client options:
| Option | Default value| Required | Description |
| ---- | ---- | ---- | ---- |
| host | https://api.0x18.io | ❌ | API endpoint that is called by the client |
| numberOfApiCallRetries | 0 | ❌ | Number of retries, that retry mechanism should try to call API, before failing the response |
| apiKeyPromise | - | ❌ | Promise which after resolved should return api-key. For example AWS secrets manager getter. |
| apiKey | - | ✅ | Api Key from the [hex panel](https://hex.0x18.io/org/keys) for your organization. If `apiKeyPromise` is provided, it's not required |

## Resources

Main resources that are used in 0x18 ecosystem.

### Ledgers

### Create

There are multiple ways to create a ledger

```javascript
const { Ledger } = require('@official-0x18/sdk');

// Option 1
const ledger = await ox.ledgers.create({ suffix: 'SDK', precision: 0 });

// Option 2
const ledger2 = Ledger.build({ suffix: 'SDK', precision: 0 });
await ledger2.save();

// Option 3
const ledger3 = await Ledger.create({ suffix: 'SDK', precision: 0 });
```

All of these lead to the same result.

### Read

To get a single ledger:

```javascript
// A single ledger instance from API
const ledger = await ox.ledgers.findOne();
```

Getting multiple ledgers and going through pagination results:

```javascript
// Gets first ledger page with a single ledger per page
let { results, pageInfo, fetchMore } = await ox.ledgers.findAll({
    first: 1,
});

// Get another ledgers page
({ results, pageInfo, fetchMore } = await fetchMore());
```

### Update

Before updating a ledger we need to have it's instance:

```javascript
// Get a single ledger instance
const ledger = await ox.ledgers.findOne();

// Update ledger property
ledger.description = 'HELLO FROM SDK';

// Commit ledger updates to API
await ledger.save();
```

### Delete

Before deleting a ledger we need to have it's instance:

```javascript
// Get a single ledger instance
const ledger = await ox.ledgers.findOne();

// Archives a given ledger instance
await singleNode.archive();
```

## Wallets

### Create

```javascript
const { Wallet } = require('@official-0x18/sdk');

// Option 1
const wallet = await ox.wallets.create({ displayName: 'Hello_from_sdk' });

// Option 2
const wallet2 = Wallet.build({ displayName: 'Hello_from_sdk' });
await wallet2.save();

// Option 3
const wallet3 = await Wallet.create({ displayName: 'Hello_from_sdk' });
```

### Read

To get a single wallet:

```javascript
// A single wallet instance from API
const wallet = await ox.wallets.findOne();
```

Getting multiple wallets and going through pagination results:

```javascript
// Gets first wallet page with a single wallet per page
let { results, pageInfo, fetchMore } = await ox.wallets.findAll({
    first: 1,
});

// Get another wallets page
({ results, pageInfo, fetchMore } = await fetchMore());
```

### Update

Before updating a wallet we need to have it's instance:

```javascript
// Get a single wallet instance
const wallet = await ox.wallets.findOne();

// Update wallet property
wallet.metadata['today'] = new Date().toISOString();

// Commit wallet updates to API
await wallet.save();
```

### Delete

Before deleting a wallet we need to have it's instance:

```javascript
// Get a single wallet instance
const wallet = await ox.wallets.findOne();

// Archives a given wallet instance
await singleNode.archive();
```

## Transactions

### Create

```javascript
const { Transaction } = require('@official-0x18/sdk');

// Option 1
const transaction = await ox.transactions.create({
    amount: '100',
    ledgerId: '0xfABDD4....', // Ledger id
    walletId: '0xDF39Aa....', // Wallet id
    method: Transaction.METHODS.MINT,
});

// Option 2
const transaction2 = Transaction.build({
    amount: '100',
    ledgerId: '0xfABDD4....', // Ledger id
    walletId: '0xDF39Aa....', // Wallet id
    method: Transaction.METHODS.MINT,
});
await transaction2.save();

// Option 3
const transaction3 = await Transaction.create({
    amount: '100',
    ledgerId: '0xfABDD4....', // Ledger id
    walletId: '0xDF39Aa....', // Wallet id
    method: Transaction.METHODS.MINT,
});
```

### Create bulk

There is also a way to create multiple transactions in a single method call:

```javascript
const { Transaction } = require('@official-0x18/sdk');

const txs = await ox.transactions.bulkCreate([
    {
        amount: '100',
        ledgerId: '0xfABDD4....', // Ledger id
        walletId: '0xDF39Aa....', // Wallet id
        method: Transaction.METHODS.MINT,
    },
    {
        amount: '100',
        ledgerId: '0xfABDD4....', // Ledger id
        walletId: '0xDF39Aa....', // Wallet id
        method: Transaction.METHODS.BURN,
    },
]);
```

### Read

To get a single transaction:

```javascript
// A single transaction instance from API
const transaction = await ox.transactions.findOne();
```

Getting multiple transactions and going through pagination results:

```javascript
// Gets first transaction page with a single transaction per page
let { results, pageInfo, fetchMore } = await ox.transactions.findAll({
    first: 1,
});

// Get another transaction page
({ results, pageInfo, fetchMore } = await fetchMore());
```

### Update

Before updating a transaction we need to have it's instance:

```javascript
// Get a single transaction instance
const transaction = await ox.transactions.findOne();

// Update transaction property
transaction.reference = 'Hello from SDK';

// Commit transaction updates to API
await transaction.save();
```

### Delete

Once transactions are committed, they cannot be archived.

## Accessing nested resources

Some resources have nested resources available. They can be reached using getters.

Most of the resources should come paginated.

For example this is how you can get wallet ledgers:

```javascript
// First let's get a single wallet
const wallet = await ox.wallets.findOne();

// Then let's get it's ledgers
await wallet.getLedgers();

// After this is done we can access wallet related ledgers
console.log(wallet.ledgers?.results);
```

## Graphql Client

Not everything what available is currently implemented in the SDK. You can find a full available Graphql schema in our schema explorer: [here](https://explorer.0x18.io/).

To make it easier to do queries and mutations using our SDK, we've added Graphql client to it.

Example:

```javascript
await ox.gqlClient.request(
    `query Transactions ($input: TransactionsGetInput!) {
        transactions (input: $input) {
            pageInfo {
                hasNextPage, hasPreviousPage, startCursor, endCursor
            },
            edges {
                node {
                    amount, balance, createdAt, description, errors, hash, id, identity, metadata, method
                },
                cursor
            }
        }
    }`,
    {
        input: {
            first: 2,
        },
    }
);
```

## Links

-   [Official documentation](https://docs.0x18.io/)
-   [Hex panel](https://hex.0x18.io/)
