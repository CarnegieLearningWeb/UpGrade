# UpGrade Client Library - Full Node

This is the Node.js-optimized version of the UpGrade client library with axios bundled.

## Installation

```bash
npm install upgrade_client_lib_full_node
```

## Usage

```javascript
const UpgradeClient = require('upgrade_client_lib_full_node');

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
- **Axios:** Bundled (no peer dependency required)
- **Size:** ~684 KB
- **Dependencies:** uuid

## When to Use This Package

Use `upgrade_client_lib_full_node` when:
- You're building a Node.js application or server
- You want a simple, batteries-included installation
- You don't already use axios in your project
- Bundle size isn't a critical concern

## Alternative Packages

- **`upgrade_client_lib_lite_node`** - Node.js version with externalized axios (smaller if you already use axios)
- **`upgrade_client_lib_full_browser`** - Browser version with bundled axios
- **`upgrade_client_lib`** - Original package with all bundles (use conditional imports)

## Documentation

For full documentation, API reference, and examples, see the [main repository](https://github.com/CarnegieLearningWeb/UpGrade/tree/main/clientlibs/js).

## License

ISC
