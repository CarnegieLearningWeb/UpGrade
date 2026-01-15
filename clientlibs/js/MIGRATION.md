# Migration Guide: Lite Package Consolidation

## Overview

The separate `upgrade_client_lib_lite_browser` and `upgrade_client_lib_lite_node` packages have been consolidated into a single universal package: `upgrade_client_lib_lite`.

## Why This Change?

1. **Simpler Package Selection**: One package works everywhere
2. **Dead Code Removal**: The backend never used the `Client-source` header that differentiated these packages
3. **Reduced Maintenance**: One package to maintain instead of two
4. **Same Functionality**: Both packages were virtually identical - only difference was an unused HTTP header

## Migration Steps

### Step 1: Update package.json

**Before:**
```json
{
  "dependencies": {
    "upgrade_client_lib_lite_browser": "^6.2.5",
    "axios": "^1.4.0"
  }
}
```
or
```json
{
  "dependencies": {
    "upgrade_client_lib_lite_node": "^6.2.5",
    "axios": "^1.4.0"
  }
}
```

**After:**
```json
{
  "dependencies": {
    "upgrade_client_lib_lite": "^6.2.5",
    "axios": "^1.4.0"
  }
}
```

### Step 2: Update imports

**Before:**
```javascript
import UpgradeClient from 'upgrade_client_lib_lite_browser';
// or
import UpgradeClient from 'upgrade_client_lib_lite_node';
// or
const UpgradeClient = require('upgrade_client_lib_lite_node');
```

**After:**
```javascript
import UpgradeClient from 'upgrade_client_lib_lite';
// or
const UpgradeClient = require('upgrade_client_lib_lite');
```

### Step 3: No code changes needed!

The API is identical. Your existing code will work without modifications:

```javascript
const client = new UpgradeClient(
  'user123',
  'https://your-upgrade-server.com',
  'my-app-context'
);

await client.init();
const assignments = await client.getAllExperimentConditions();
// Everything works the same!
```

## What Changed Under the Hood

### Removed Dead Code
The `Client-source` HTTP header (which sent either "browser" or "node") has been removed because:
- The backend never read or used this header
- It served no functional purpose
- Removing it simplifies the codebase

### Universal Bundle
The new `upgrade_client_lib_lite` package:
- Works in both browser and Node.js environments
- No runtime environment detection needed (simpler code)
- Single webpack bundle instead of two separate builds
- ~450KB size (same as before)

## Backward Compatibility

**Breaking Change:** The old packages (`upgrade_client_lib_lite_browser` and `upgrade_client_lib_lite_node`) have been removed and replaced with the unified `upgrade_client_lib_lite` package.

If you're using these packages, you must migrate to the new package. The migration is simple (just change the package name) and the API is identical.

## TypeScript Types

No changes to TypeScript types - everything remains the same:

```typescript
import UpgradeClient, {
  Assignment,
  MARKED_DECISION_POINT_STATUS,
  IExperimentAssignmentv5
} from 'upgrade_client_lib_lite';
```

## Testing Your Migration

After migrating, test your application to ensure:

1. **Browser environment**: The client initializes and fetches assignments correctly
2. **Node.js environment**: The client works in server-side code
3. **Axios integration**: Your custom axios configuration still works
4. **Build process**: Your bundle size should remain approximately the same

## Troubleshooting

### "Cannot find module 'upgrade_client_lib_lite'"

Run `npm install` to ensure the new package is installed:

```bash
npm install
```

### Different bundle size after migration

The unified lite bundle should be approximately the same size (~450KB) as the previous browser-lite and node-lite bundles. If you see a significant difference, check that:
- Axios is still externalized (peer dependency)
- Your build tool is tree-shaking unused code

### Import errors after migration

Make sure to update all imports throughout your codebase:

```bash
# Find all occurrences
grep -r "upgrade_client_lib_lite_browser" .
grep -r "upgrade_client_lib_lite_node" .
```

## Questions?

If you encounter any issues during migration, please open an issue on GitHub:
https://github.com/CarnegieLearningWeb/UpGrade/issues

## Related Changes

This consolidation is part of a broader effort to simplify the UpGrade client library package structure. For more details, see:
- [Main README](./README.md)
- [Package Documentation](https://github.com/CarnegieLearningWeb/UpGrade/tree/main/clientlibs/js)
