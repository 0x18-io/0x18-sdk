# 0x18-sdk

0x18 SDK library provides a convenient way to work with 0x18 API.

# Documentation

More documentation about specific features can be found in official documentation page [here](https://docs.0x18.io/).

# Installing

```
npm i @official-0x18/0x18-api-client
```

# Usage

To use SDK client has to be always initialized. It is configured using your organization API key, that you can find in the hex panel.

```javascript
const { Client } = require('@official-0x18/0x18-api-client');

const ox = new Client({ apiKey: <org-api-key> });
```

For ES modules

```javascript
import { Client } from '@official-0x18/0x18-api-client';

const ox = new Client({ apiKey: <org-api-key> });
```

Client options:

| Option                 | Default value       | Required | Description                                                                                                                                                     |
| ---------------------- | ------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| host                   | https://api.0x18.io | ❌       | API endpoint that is called by the client                                                                                                                       |
| numberOfApiCallRetries | 0                   | ❌       | Number of retries, that retry mechanism should try to call API, before failing the response                                                                     |
| apiKey                 | -                   | ✅       | Api Key from the [hex panel](https://hex.0x18.io/org/keys) for your organization. If a function that returns a `promise` is provided it will resolve to get key |

## Resource methods

We will show some examples with ledgers for reference but wallets and transactions work the same way.

### findAll

See [pagination](#pagination) section for more details.

```javascript
// Gets first ledger page with a single ledger per page
let { results, pageInfo, fetchMore } = await ox.ledgers.findAll({
    first: 1,
});
```

### findOne

```javascript
const ledger = await ox.ledgers.findOne({ id: '0xfABDD4....' });
```

### Create - Through the collection resource

```javascript
const wallet = await ox.ledgers.create({ displayName: 'HelloWorld!' });
```

### Creating an instance - Direct

Although a model is a class, you should not create instances by using the `new` operator directly. Instead, the `build` method should be used:

```javascript
const { Ledger } = require('@official-0x18/0x18-api-client');

const ledger = Ledger.build({ displayName: 'HelloWorld!' });
console.log(ledger instanceof Ledger); // true
console.log(ledger.displayName); // "HelloWorld!"
```

However, the code above does not communicate with the API at all (note that it is not even asynchronous)! This is because the `build` method only creates an object that _represents_ data that _can_ be mapped to the API. In order to really save (i.e. persist) this instance in the API, the `save` method should be `used`:

```javascript
await ledger.save();
console.log('ledger was saved!');
```

Note, from the usage of `await` in the snippet above, that `save` is an asynchronous method. In fact, almost every method is asynchronous; `build` is one of the very few exceptions.

### A very useful shortcut: the create method - Direct

Here is the `create` method, which combines the `build` and `save` methods shown above into a single method:

```javascript
const { Ledger } = require('@official-0x18/0x18-api-client');

const ledger = await Ledger.create({ displayName: 'HelloWorld!' });
// HelloWorld! exists in the API now!
console.log(ledger instanceof Ledger); // true
console.log(ledger.displayName); // "HelloWorld!"
```

### Accessing nested resources

Some resources have nested resources available. They can be reached using getters. Most of the resources should come paginated.

For example this is how you can get ledgers attached to a wallet with a non zero balance:

```javascript
// First let's get a single wallet
const wallet = await ox.wallets.findOne();

await wallet.getLedgers();
// now wallet.ledgers is populated with paginated results

console.log(wallet.ledgers?.results);
```

### Pagination

All `findAll` methods return `results`, `pageInfo` and `fetchMore` properties. `results` is an array of results, `pageInfo` contains information about current page and `fetchMore` is a function that can be called to get the next page.

Each result is an instance of a model. For example, `results` in `findAll` for ledgers will be an array of `Ledger` instances.

```javascript
// Gets first ledger page with a single ledger per page
let { results, pageInfo, fetchMore } = await ox.ledgers.findAll({
    first: 1,
});

// Get another ledgers page
({ results, pageInfo, fetchMore } = await fetchMore());
```

&nbsp;

---

## Ledgers

Collection name is `ledgers`.

### Collection Methods

| Method  | Description          |
| ------- | -------------------- |
| create  | Creates a new ledger |
| findAll | Gets all ledgers     |
| findOne | Gets a single ledger |

### Instance Methods

| Method  | Description                       |
| ------- | --------------------------------- |
| archive | Archives a ledger                 |
| save    | Saves a ledger after modification |

### Instance Properties

| Property    | Required | Updatable | Description                                                  |
| ----------- | -------- | --------- | ------------------------------------------------------------ |
| suffix      | ✅       | ✅        | Ledger suffix                                                |
| precision   | ✅       | ✅        | Ledger precision                                             |
| displayName | ❌       | ✅        | Ledger display name                                          |
| description | ❌       | ✅        | Ledger description                                           |
| reference   | ❌       | ✅        | Used for your application to identify a ledger in our system |

## Wallets

Collection name is `wallets`.

### Collection Methods

| Method  | Description          |
| ------- | -------------------- |
| create  | Creates a new wallet |
| findAll | Gets all wallets     |
| findOne | Gets a single wallet |

### Instance Methods

| Method  | Description                       |
| ------- | --------------------------------- |
| archive | Archives a wallet                 |
| save    | Saves a wallet after modification |

### Creatable Instance Properties

| Property    | Required | Updatable | Description                                                  |
| ----------- | -------- | --------- | ------------------------------------------------------------ |
| displayName | ❌       | ✅        | wallet display name                                          |
| metadata    | ❌       | ✅        | wallet metadata - JSONable                                   |
| reference   | ❌       | ✅        | Used for your application to identify a wallet in our system |

## Transactions

Collection name is `transactions`.

### Collection Methods

| Method  | Description               |
| ------- | ------------------------- |
| create  | Creates a new transaction |
| findAll | Gets all transactions     |
| findOne | Gets a single transaction |

### Instance Methods

| Method | Description                                 |
| ------ | ------------------------------------------- |
| save   | Saves a transaction after its been modified |

### Creatable Instance Properties

| Property       | Required | Updatable | Description                                                       |
| -------------- | -------- | --------- | ----------------------------------------------------------------- |
| method         | ✅       | ❌        | `mint` or `burn`                                                  |
| ledgerId       | ✅       | ❌        | The ledger id                                                     |
| walletId       | ✅       | ❌        | The wallet id                                                     |
| amount         | ✅       | ❌        | The amount of tokens to mint or burn                              |
| idempotencyKey | ❌       | ❌        | Used to prevent duplicates                                        |
| metadata       | ❌       | ✅        | transaction metadata - JSONable                                   |
| reference      | ❌       | ✅        | Used for your application to identify a transaction in our system |

### Delete

Once transactions are committed, they cannot be archived.

## Graphql Client

Not everything what available is currently implemented in the SDK. You can find a full available Graphql schema in our schema explorer: [here](https://explorer.0x18.io/).

To make it easier to do queries and mutations using our SDK, we've added Graphql client to it.

Example:

```javascript
const gqlResult = await ox.gqlClient.request(
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

// Transactions
console.log(gqlResult.transactions.edges);
// Results from gqlClient come as a plain objects
console.log(gqlResult instanceof Object); // true
```

## Links

-   [Official documentation](https://docs.0x18.io/)
-   [Hex panel](https://hex.0x18.io/)
