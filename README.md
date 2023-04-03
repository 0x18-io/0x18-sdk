# 0x18-sdk

0x18 SDK library provides a convenient way to work with 0x18 API.

## Documentation

More documentation about specific features can be found in official documentation page [here](https://docs.0x18.io/).

## Installation

Install package with:

```
npm install 0x18
#or
yarn add 0x18
```

## Usage

SDK is configured using your organization API key, that you can find in the hex panel.

```
import Client from '0x18';

const ox = new Client({ apiKey: <org-api-key> });
```

Other config options:
| Option | Default value| Description |
| ---- | ---- | ---- |
| host | https://api.0x18.io | API endpoint that is called by the client |
| numberOfApiCallRetries | 0 | Number of retries, that retry mechanism should try to call API, before failing the response |
| apiKeyPromise | - | Promise which after resolved should return api-key. For example AWS secrets manager getter. |

## Resources

Main resources that are used in 0x18 ecosystem.

### Ledgers

### Create

There are three ways to create a ledger

```
import Client from '0x18';
import Ledger from '0x18/resources/ledgers';

const ox = new Client({ apiKey: <api-key> });

(async () => {
    // 1
    const ledger = await ox.ledgers.create({ suffix: 'SDK', precision: 0 });

    // 2
    const ledger2 = Ledger.build({ suffix: 'SDK', precision: 0 });
    await ledger2.save();

    // 3
    const ledger3 = await Ledger.create({ suffix: 'SDK', precision: 0 });
})();
```

All of these lead to the same result.

### Read

To get a single ledger:

```
import Client from '0x18';

const ox = new Client({ apiKey: <api-key> });

(async () => {
    // A single ledger instance from API
    const ledger = await ox.ledgers.findOne();
})();
```

Getting multiple ledgers and going through pagination results:

```
import Client from '0x18';

const ox = new Client({ apiKey: <api-key> });

(async () => {
    // Gets first ledger page with a single ledger per page
    let { results, pageInfo, fetchMore } = await ox.ledgers.findAll({
        first: 1,
    });

    // Get another ledgers page
    ({ results, pageInfo, fetchMore } = await fetchMore());
})();
```

### Update

Before updating a ledger we need to have it's instance:

```
import Client from '0x18';

const ox = new Client({ apiKey: <api-key> });

(async () => {
    // Get a single ledger instance
    const ledger = await ox.ledgers.findOne();

    // Update ledger property
    ledger.description = 'HELLO FROM SDK';

    // Commit ledger updates to API
    await ledger.save()
})();
```

### Delete

Before deleting a ledger we need to have it's instance:

```
import Client from '0x18';

const ox = new Client({ apiKey: <api-key> });

(async () => {
    // Get a single ledger instance
    const ledger = await ox.ledgers.findOne();

    // Archives a given ledger instance
    await singleNode.archive()
})();
```

## Wallets

### Create
TBD
### Read
TBD
### Updated
TBD
### Delete

## Transactions

### Create
TBD
### Create bulk
TBD
### Read
TBD
### Updated
TBD
### Delete

## Accessing nested resources
TBD

## Links

-   [Official documentation](https://docs.0x18.io/)
-   [Hex panel](https://hex.0x18.io/)
