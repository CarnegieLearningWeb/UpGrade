# UpGrade Client Library - Lite Node

This is the Node.js-optimized version of the UpGrade client library with axios externalized as a peer dependency.

## Installation

**Important:** This package requires axios as a peer dependency. Install both:

```bash
npm install upgrade_client_lib_lite_node axios
```

## Usage

```javascript
const UpgradeClient = require('upgrade_client_lib_lite_node');

const client = UpgradeClient.init({
  userId: 'user123',
  hostURL: 'https://your-upgrade-server.com',
  context: ['context1']
});

// Use the client
await client.setGroupMembership({ group1: ['user1', 'user2'] });
await client.getAllExperimentConditions(['context1']);
```

## Bundle Details

- **Target:** Node.js environments
- **Axios:** Externalized (peer dependency - you must provide it)
- **Size:** ~449 KB (smaller than full version)
- **Dependencies:** uuid
- **Peer Dependencies:** axios ^1.4.0

## When to Use This Package

Use `upgrade_client_lib_lite_node` when:
- You're building a Node.js application or server
- You already use axios in your project (avoids bundling it twice)
- You want to minimize bundle size
- You want control over the axios version

## Alternative Packages

- **`upgrade_client_lib_full_node`** - Node.js version with bundled axios (simpler but larger)
- **`upgrade_client_lib_lite_browser`** - Browser version with externalized axios
- **`upgrade_client_lib`** - Original package with all bundles (use conditional imports)

## Documentation

For full documentation, API reference, and examples, see the [main repository](https://github.com/CarnegieLearningWeb/UpGrade/tree/main/clientlibs/js).

## License

ISC
