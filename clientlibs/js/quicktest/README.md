# UpGrade Client - QuickTest Suite

Comprehensive test suite for the UpGrade Client library with support for **Node.js**, **Browser JavaScript**, and **Browser TypeScript** environments. All three test types share the same core test logic, ensuring consistent behavior across environments.

## 🚀 Quick Start

### Three Ways to Run Tests

**All commands automatically compile TypeScript when needed - no manual build steps required!**

```bash
# 1. Node.js (Default - Fastest)
npm run quicktest:node
# or simply: npm run quicktest

# 2. Browser JavaScript (Auto-compiles shared functions)
npm run quicktest:browser-js

# 3. Browser TypeScript (Auto-compiles, type-safe)
npm run quicktest:browser-ts
```

## 📁 Directory Structure

```
quicktest/
├── shared/
│   ├── test-functions.ts       # Shared test logic (used by all 3 types)
│   └── test-functions.js       # Compiled for browser-js
├── node/
│   ├── config.ts               # Node.js configuration
│   └── index.ts                # Node.js entry point
├── browser-js/
│   ├── config.js               # Browser JS configuration
│   ├── index.js                # Browser JS entry point
│   └── index.html              # Browser JS HTML page
├── browser-ts/
│   ├── config.ts               # Browser TS configuration
│   ├── index.ts                # Browser TS entry point
│   └── index.html              # Browser TS HTML page
├── tsconfig.shared.json        # Compile shared to JS
├── tsconfig.browser-ts.json    # Compile browser-ts
├── .gitignore
└── README.md
```

## 🎯 Detailed Usage

### 1. Node.js Test

**Run:**
```bash
npm run quicktest:node
# or: npm run quicktest
```

**Description:**
- Runs in Node.js environment using `ts-node`
- Uses the Node.js bundle (`dist/node/index.js`)
- Outputs to console only
- No compilation needed (ts-node handles it)
- Fastest option for quick testing

**Configuration:**
Edit [node/config.ts](node/config.ts) to change:
- `hostUrl` - API server URL (defaults to `localhost:3030`)
- `userId`, `context`, `site`, `target` - Test parameters
- All other test configuration values

### 2. Browser JavaScript Test

**Run:**
```bash
npm run quicktest:browser-js
```

**Description:**
- Automatically compiles shared test functions from TypeScript to JavaScript
- Opens [browser-js/index.html](browser-js/index.html) in your default browser
- Uses the browser bundle (`dist/browser/index.js`)
- Displays results on page AND in browser console (F12)
- Perfect for quick browser testing

**How it works:**
1. Compiles `shared/test-functions.ts` → `shared/test-functions.js`
2. Opens HTML which loads UpgradeClient browser bundle via script tag
3. Loads compiled shared functions (`shared/test-functions.js`)
4. Loads config and runs tests automatically on page load
5. Results display in both browser console and on the page

**Configuration:**
Edit [browser-js/config.js](browser-js/config.js) to change test parameters.

**Manual Usage:**
If you need to manually compile and open:
```bash
npm run quicktest:build-shared  # Compile shared functions
open quicktest/browser-js/index.html  # Or double-click the file
```

### 3. Browser TypeScript Test

**Run:**
```bash
npm run quicktest:browser-ts
```

**Description:**
- Automatically compiles TypeScript files to JavaScript
- Opens [browser-ts/index.html](browser-ts/index.html) in your default browser
- Uses the browser bundle (`dist/browser/index.js`)
- Displays results on page AND in browser console (F12)
- Type-safe configuration and entry point
- Includes source maps for debugging

**Build only (without opening browser):**
```bash
npm run quicktest:browser-ts:build
```

**How it works:**
1. Compiles `browser-ts/` TypeScript files using ES modules
2. HTML loads UpgradeClient browser bundle
3. Loads compiled test files as ES modules
4. Runs tests automatically on page load

**Configuration:**
Edit [browser-ts/config.ts](browser-ts/config.ts) to change test parameters.

**Manual Usage:**
1. Compile: `npm run quicktest:browser-ts:build`
2. Open [browser-ts/index.html](browser-ts/index.html) in a browser

## 🔧 Configuration

Each test type has its own configuration file where you can customize:

### Common Configuration Options

```typescript
{
  userId: string;           // User identifier for tests
  hostUrl: string;          // UpGrade API server URL
  context: string;          // Application context
  site: string;             // Decision point site
  target: string;           // Decision point target
  status: string;           // Marked decision point status
  group: object;            // User group membership
  workingGroup: string;     // Working group
  alias: string;            // User alias
  rewardValue: string;      // Reward value (SUCCESS/FAILURE)
  rewardSite: string;       // Reward site
  rewardTarget: string;     // Reward target
  experimentId: string;     // Experiment ID for rewards
  featureFlagKey: string;   // Feature flag key for testing
  options: object;          // Client initialization options
}
```

### Available Server URLs

All config files include these predefined URLs:

```javascript
URL.LOCAL              // http://localhost:3030
URL.BEANSTALK_QA       // https://upgradeapi.qa-cli.net
URL.BEANSTALK_STAGING  // https://upgradeapi.qa-cli.com
URL.ECS_QA             // https://apps.qa-cli.net/upgrade-service
URL.ECS_STAGING        // https://apps.qa-cli.com/upgrade-service
```

## 🧪 What Gets Tested

All three test types run the same test sequence:

1. **client.init()** - Initialize the client
2. **client.setGroupMembership()** - Set user group membership
3. **client.setWorkingGroup()** - Set working group
4. **client.setAltUserIds()** - Set user aliases
5. **client.getDecisionPointAssignment()** - Get decision point assignment
6. **client.markDecisionPoint()** - Mark a decision point
7. **client.sendReward()** - Send reward by decision point

Additional tests available (currently commented out in shared functions):
- `getAllExperimentConditions()` - Get all experiment conditions
- `getAllFeatureFlags()` - Get all feature flags
- `hasFeatureFlag()` - Check specific feature flag
- `log()` - Send logging data

## 📊 Viewing Results

### Node.js
- Results output to terminal/console
- Colored output with JSON formatting
- Errors display with full stack traces

### Browser Tests
- **On Page**: Visual output with color-coded messages
  - Headers (cyan)
  - Errors (red)
  - Success (green)
  - Status indicator at top
- **In Console**: Full JSON responses logged to browser DevTools (press F12)
- **Network Tab**: See actual HTTP requests to UpGrade server

## 🛠 Development

### Modifying Test Logic

All test logic is in [shared/test-functions.ts](shared/test-functions.ts).

**After modifying shared functions:**

Just run your preferred quicktest command - compilation happens automatically:
- `npm run quicktest:node` - No compilation needed (uses `ts-node`)
- `npm run quicktest:browser-js` - Auto-compiles shared functions, then opens browser
- `npm run quicktest:browser-ts` - Auto-compiles browser-ts and shared functions, then opens browser

**Manual compilation (if needed):**
```bash
npm run quicktest:build-shared  # Compile shared functions only
```

### Adding New Tests

1. Add test function to [shared/test-functions.ts](shared/test-functions.ts):
```typescript
export async function doMyNewTest(client: any, config: TestConfig): Promise<void> {
  try {
    const response = await client.myNewMethod();
    dualLog('[My New Test response]:', response);
  } catch (error) {
    logAxiosError('My New Test', error);
  }
}
```

2. Add to `runTests()` orchestrator in [shared/test-functions.ts](shared/test-functions.ts):
```typescript
dualLog('\n=== Running My New Test ===', null, 'header');
await doMyNewTest(client, config);
```

3. Run tests in your preferred environment (compilation happens automatically):
```bash
npm run quicktest:node          # or
npm run quicktest:browser-js    # or
npm run quicktest:browser-ts
```

### TypeScript Compilation

**Note:** All quicktest commands automatically compile when needed. Use these commands only if you need to compile without running tests.

**Shared functions** (for browser-js):
```bash
npm run quicktest:build-shared
# Compiles: shared/test-functions.ts → shared/test-functions.js
# (Automatically run by quicktest:browser-js)
```

**Browser TypeScript**:
```bash
npm run quicktest:browser-ts:build
# Compiles: browser-ts/*.ts → browser-ts/*.js (ES modules)
# (Automatically run by quicktest:browser-ts)
```

## 🔍 Debugging

### Node.js
- Add breakpoints in your IDE
- Or use Node.js inspector: `node --inspect-brk ./node_modules/.bin/ts-node quicktest/node/index.ts`

### Browser Tests
1. Open DevTools (F12)
2. Go to Sources tab
3. Find test files:
   - **browser-js**: `shared/test-functions.js`, `browser-js/index.js`
   - **browser-ts**: Original `.ts` files (via source maps)
4. Set breakpoints and refresh page

## ⚠️ Troubleshooting

### "UpgradeClient is not defined" (Browser)
- Ensure browser bundle is built: `npm run build`
- Check that `dist/browser/index.js` exists
- Verify HTML loads bundle before test scripts

### "Cannot find module" (Node.js)
- Ensure Node bundle is built: `npm run build`
- Check that `dist/node/index.js` exists

### "Failed to fetch" / CORS errors (Browser)
- Verify UpGrade server is running
- Check `hostUrl` in config files
- Ensure server allows CORS from `file://` or your domain

### Browser-TS: Compiled files not found
- If using npm commands, compilation happens automatically
- If opening HTML file directly, run `npm run quicktest:browser-ts:build` first
- Check that `browser-ts/*.js` files were created
- Look for TypeScript compilation errors in terminal output

### Shared functions not updated (browser-js)
- If using `npm run quicktest:browser-js`, compilation happens automatically
- If opening HTML file directly, run `npm run quicktest:build-shared` first
- Hard refresh browser (Cmd/Ctrl + Shift + R) if changes don't appear

## 📚 Architecture

### Shared Logic Pattern

All test logic lives in one place ([shared/test-functions.ts](shared/test-functions.ts)) and is reused across all three environments:

- **Test Functions**: Accept `client`, `config`, and work in any environment
- **DOM Helpers**: Auto-detect environment (browser vs Node)
  - In browser: Update page elements
  - In Node: Fall back to console (no-op for DOM operations)
- **Logger Abstraction**: `dualLog()` function works everywhere
  - Browser: Logs to console AND page
  - Node: Logs to console only

### Benefits

1. **DRY Principle**: Write tests once, run everywhere
2. **Consistency**: Identical test behavior across environments
3. **Easy Maintenance**: Update test logic in one place
4. **Type Safety**: Shared functions are TypeScript with full typing
5. **Flexible**: Each environment can have custom configuration

## 🔗 Related Files

- **Browser bundle**: `../../dist/browser/index.js`
- **Node bundle**: `../../dist/node/index.js`
- **Type definitions**: `../../dist/browser/index.d.ts`, `../../dist/node/index.d.ts`
- **Main package.json**: `../../package.json`

## 📝 Notes

- The `quicktest` npm script defaults to Node.js (`quicktest:node`)
- Browser tests auto-run on page load
- Shared functions compile to CommonJS for browser-js compatibility
- Browser-TS compiles to ES modules for native import support
- All three tests use the same API endpoints and test parameters (unless customized)
