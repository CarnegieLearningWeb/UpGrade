// Build-check wrapper for looper.ts — same pattern as run.ts.
// looper.ts spawns quickTest.ts, which has a static import of ../dist/node.
// Node resolves static imports before any code runs, so dist/node must exist
// before that subprocess starts. This wrapper ensures the build happens first.

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
const result = spawnSync(tsNode, [path.resolve(__dirname, 'looper.ts'), ...passthrough], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..'),
});
process.exit(result.status ?? 0);
