# UpGrade Client Library - Lite (Universal)

This is the universal version of the UpGrade client library with axios externalized as a peer dependency. It works in both browser and Node.js environments without requiring separate packages.

## Installation

**Important:** This package requires axios as a peer dependency. Install both:

```bash
npm install upgrade_client_lib_lite axios
```

## Features

- **Universal:** Works in both browser and Node.js environments
- **Lightweight:** Axios externalized as peer dependency (~450KB)
- **Single Bundle:** One package for all JavaScript environments
- **Fully Compatible:** Drop-in replacement for lite-browser and lite-node packages

## Usage

### Browser (ES Modules)
```javascript
import UpgradeClient from 'upgrade_client_lib_lite';

const client = UpgradeClient.init({
  userId: 'user123',
  hostURL: 'https://your-upgrade-server.com',
  context: ['context1']
});
```

### Node.js (CommonJS)
```javascript
const UpgradeClient = require('upgrade_client_lib_lite');

const client = UpgradeClient.init({
  userId: 'user123',
  hostURL: 'https://your-upgrade-server.com',
  context: ['context1']
});
```

### Node.js (ES Modules)
```javascript
import UpgradeClient from 'upgrade_client_lib_lite';

const client = UpgradeClient.init({
  userId: 'user123',
  hostURL: 'https://your-upgrade-server.com',
  context: ['context1']
});
```

## Bundle Details

- **Target:** Universal (browser and Node.js)
- **Axios:** Externalized (peer dependency - you must provide it)
- **Size:** ~450 KB
- **Dependencies:** uuid
- **Peer Dependencies:** axios ^1.4.0

## When to Use This Package

Use `upgrade_client_lib_lite` when:
- You already use axios in your project (avoids bundling it twice)
- You want to minimize bundle size
- You want control over the axios version
- You need a single package that works everywhere

## Migrating from Separate Packages

If you're currently using `upgrade_client_lib_lite_browser` or `upgrade_client_lib_lite_node`, migration is straightforward:

```javascript
// Old way - separate packages
import UpgradeClient from 'upgrade_client_lib_lite_browser';
// or
import UpgradeClient from 'upgrade_client_lib_lite_node';

// New way - single universal package
import UpgradeClient from 'upgrade_client_lib_lite';
// Works the same in both environments!
```

**Note:** The old packages are deprecated and will be maintained as aliases for backward compatibility during the transition period.

## Alternative Packages

- **`upgrade_client_lib_full_browser`** - Browser version with bundled axios
- **`upgrade_client_lib_full_node`** - Node.js version with bundled axios
- **`upgrade_client_lib`** - Original package with all bundles (use conditional imports)

## Documentation

For full documentation, API reference, and examples, see the [main repository](https://github.com/CarnegieLearningWeb/UpGrade/tree/main/clientlibs/js).

## License

ISC
