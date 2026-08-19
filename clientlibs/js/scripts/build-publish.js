#!/usr/bin/env node

/**
 * Build the TS client library and publish the requested package(s) to the
 * configured npm registry (CodeArtifact).
 *
 * Usage:
 *   yarn clientlib-ts build-publish <lite|default|all> [--dry-run] [--skip-build]
 *
 * Targets:
 *   default  clientlibs/js               -> upgrade_client_lib      (browser + node + lite bundles)
 *   lite     clientlibs/js/packages/lite -> upgrade_client_lib_lite (lite bundle only)
 *   all      both of the above
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const TARGETS = {
  default: { dir: ROOT, bundles: ['browser', 'node', 'lite'] },
  lite: { dir: path.join(ROOT, 'packages', 'lite'), bundles: ['lite'] },
};

function usage(message) {
  if (message) console.error(`\n❌ ${message}`);
  console.error(`
Usage: yarn clientlib-ts build-publish <lite|default|all> [--dry-run] [--skip-build]

  lite         publish packages/lite (upgrade_client_lib_lite)
  default      publish clientlibs/js (upgrade_client_lib)
  all          publish both

  --dry-run    run the full build, then 'npm publish --dry-run' (nothing is uploaded)
  --skip-build publish whatever is already in dist/ (no rebuild)
`);
  process.exit(1);
}

// --- parse args ---------------------------------------------------------------

const args = process.argv.slice(2);
const flags = args.filter((a) => a.startsWith('-'));
const positionals = args.filter((a) => !a.startsWith('-'));

const dryRun = flags.includes('--dry-run');
const skipBuild = flags.includes('--skip-build');

const unknownFlag = flags.find((f) => !['--dry-run', '--skip-build'].includes(f));
if (unknownFlag) usage(`Unknown flag: ${unknownFlag}`);
if (positionals.length !== 1) usage('Expected exactly one target: lite, default, or all');

const target = positionals[0];
if (!['lite', 'default', 'all'].includes(target)) usage(`Unknown target: ${target}`);

const selected = target === 'all' ? ['default', 'lite'] : [target];

// --- helpers -----------------------------------------------------------------

/**
 * `yarn run` injects npm_config_registry=https://registry.yarnpkg.com into the
 * child env, which takes precedence over .npmrc and would silently point every
 * nested npm call at the public registry instead of CodeArtifact. Strip it so
 * npm resolves the registry from .npmrc as it would outside of yarn.
 */
const CHILD_ENV = (() => {
  const env = { ...process.env };
  for (const key of Object.keys(env)) {
    if (key.toLowerCase() === 'npm_config_registry') delete env[key];
  }
  return env;
})();

function run(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    env: CHILD_ENV,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.error) throw result.error;
  return result.status === 0;
}

function capture(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    env: CHILD_ENV,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return {
    status: result.status,
    stdout: (result.stdout || '').trim(),
    stderr: (result.stderr || '').trim(),
  };
}

function readPackage(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
}

/**
 * CodeArtifact tokens expire after 12h. Derive the exact re-login command from
 * the configured registry URL so a stale token is a one-copy-paste fix.
 */
function loginHint(registry) {
  const match = /^https:\/\/([^-]+(?:-[^-]+)*)-(\d+)\.d\.codeartifact\.([a-z0-9-]+)\.amazonaws\.com\/npm\/([^/]+)/.exec(
    registry
  );
  if (!match) {
    return `Registry ${registry} does not look like CodeArtifact — check your npm auth for it.`;
  }
  const [, domain, owner, region, repository] = match;
  return [
    'CodeArtifact auth looks expired or missing. Re-login with:',
    '',
    `  aws codeartifact login --tool npm --domain ${domain} --domain-owner ${owner} \\`,
    `    --repository ${repository} --region ${region}`,
  ].join('\n');
}

function isAuthFailure(stderr) {
  return /E401|ENEEDAUTH|EAUTHUNKNOWN|401 Unauthorized|Unable to authenticate/i.test(stderr);
}

// --- preflight ---------------------------------------------------------------

const registry = capture('npm', ['config', 'get', 'registry'], ROOT).stdout;
if (!registry || registry === 'undefined') {
  console.error('\n❌ Could not determine the npm registry from npm config.');
  process.exit(1);
}

const mainVersion = readPackage(ROOT).version;

console.log(`\n📦 build-publish: target=${target} version=${mainVersion}${dryRun ? ' (dry run)' : ''}`);
console.log(`   registry: ${registry}\n`);

const plan = selected.map((name) => {
  const { dir, bundles } = TARGETS[name];
  const pkg = readPackage(dir);
  return { name, dir, bundles, pkgName: pkg.name, version: pkg.version };
});

// Auth + "already published" check, up front, before spending time on a build.
const collisions = [];
let authVerified = false;

for (const entry of plan) {
  const view = capture('npm', ['view', `${entry.pkgName}`, 'versions', '--json', '--registry', registry], ROOT);

  if (view.status !== 0) {
    if (isAuthFailure(view.stderr)) {
      console.error(`❌ ${loginHint(registry)}\n`);
      process.exit(1);
    }
    if (/E404|404 Not Found/i.test(view.stderr)) {
      // Never published — a 404 still means the registry accepted our credentials.
      authVerified = true;
      console.log(`✓ ${entry.pkgName}: not yet published, ${entry.version} is free`);
      continue;
    }
    console.error(`❌ Could not query ${entry.pkgName} on the registry:\n${view.stderr}\n`);
    process.exit(1);
  }

  authVerified = true;
  const published = JSON.parse(view.stdout || '[]');
  const versions = Array.isArray(published) ? published : [published];

  if (versions.includes(entry.version)) {
    collisions.push(entry);
    console.error(`❌ ${entry.pkgName}@${entry.version} is already published`);
  } else {
    console.log(`✓ ${entry.pkgName}: ${entry.version} is free (latest published: ${versions[versions.length - 1]})`);
  }
}

if (collisions.length) {
  console.error(
    `\nBump "version" in clientlibs/js/package.json (the build re-syncs the nested packages), then re-run.\n`
  );
  process.exit(1);
}

if (!authVerified) {
  console.log('\n⚠️  Registry auth was not exercised by the preflight; publish may still fail on a stale token.');
}

// --- build -------------------------------------------------------------------

if (skipBuild) {
  console.log('\n⏭  --skip-build: publishing existing dist/\n');
} else {
  console.log('\n🔨 Building all bundles...\n');
  if (!run('yarn', ['build'], ROOT)) {
    console.error('\n❌ Build failed — nothing was published.\n');
    process.exit(1);
  }
}

// Guard against publishing an empty package if a bundle silently went missing.
for (const entry of plan) {
  for (const bundle of entry.bundles) {
    const bundlePath = path.join(entry.dir, 'dist', bundle, 'index.js');
    if (!fs.existsSync(bundlePath)) {
      console.error(`\n❌ Missing build output for ${entry.pkgName}: ${bundlePath}`);
      console.error('   Run without --skip-build, or check the build output above.\n');
      process.exit(1);
    }
  }
}

// --- publish -----------------------------------------------------------------

const publishArgs = ['publish', '--registry', registry];
if (dryRun) publishArgs.push('--dry-run');

const failures = [];

for (const entry of plan) {
  console.log(`\n🚀 Publishing ${entry.pkgName}@${entry.version} from ${path.relative(ROOT, entry.dir) || '.'}\n`);
  const result = spawnSync('npm', publishArgs, {
    cwd: entry.dir,
    env: CHILD_ENV,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });

  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);

  if (result.status !== 0) {
    failures.push(entry);
    if (isAuthFailure(result.stderr || '')) {
      console.error(`\n❌ ${loginHint(registry)}\n`);
      break;
    }
  }
}

console.log('');

if (failures.length) {
  console.error(`❌ Failed to publish: ${failures.map((f) => f.pkgName).join(', ')}\n`);
  process.exit(1);
}

const verb = dryRun ? 'Dry run complete for' : 'Published';
console.log(`✅ ${verb}: ${plan.map((p) => `${p.pkgName}@${p.version}`).join(', ')}\n`);
