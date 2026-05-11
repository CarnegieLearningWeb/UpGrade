// ---------------------------------------------------------------------------
// Why this file exists
//
// quickTest.ts has a static import at the top:
//
//   import UpgradeClient from '../dist/node';
//
// Node/ts-node resolves ALL static imports before executing any user code.
// That means if dist/node doesn't exist yet, the process crashes on startup —
// there's no way to check for the directory and build first from inside
// quickTest.ts itself.
//
// The solution is this two-process approach:
//   1. run.ts starts, checks for dist/node, and builds if needed.
//   2. run.ts then spawns a second ts-node process to run quickTest.ts.
//      By the time that second process starts, dist/node is guaranteed to exist,
//      so its static import resolves cleanly.
//
// This file also intercepts the --build flag (force-rebuild even if dist exists)
// and strips it before forwarding the remaining args to quickTest.ts.
//
// Usage:  yarn quicktest [--build] [...quickTest args]
// ---------------------------------------------------------------------------

import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const passthrough = process.argv.slice(2);
const buildIdx = passthrough.indexOf('--build');
const forceBuild = buildIdx !== -1;
if (forceBuild) passthrough.splice(buildIdx, 1);

const distNodePath = path.resolve(__dirname, '../dist/node');

if (forceBuild || !fs.existsSync(distNodePath)) {
  console.log('[Build] Building client library...');
  execSync('npm run build', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
}

const tsNode = path.resolve(__dirname, '../node_modules/.bin/ts-node');
const result = spawnSync(tsNode, [path.resolve(__dirname, 'quickTest.ts'), ...passthrough], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
});
process.exit(result.status ?? 0);
