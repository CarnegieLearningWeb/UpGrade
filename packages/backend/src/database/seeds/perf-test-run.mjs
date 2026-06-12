/**
 * Segment membership performance comparison script.
 *
 * Measures /v6/assign and /v6/featureflag response times against the running server.
 * Run against each branch to compare.
 *
 * Usage:
 *   node perf-test-run.mjs              # warm cache (server already running)
 *   COLD=1 node perf-test-run.mjs       # cold cache (restarts server between scenarios — manual)
 *
 * Prerequisites:
 *   - Server running on localhost:3030
 *   - GOOGLE_AUTH_TOKEN_REQUIRED=false in .env (already set locally)
 *   - perf-test-seed.sql has been applied to the DB
 */

const BASE_URL = 'http://localhost:3030/api';
const AUTH_HEADER = 'fake-dev-user-google-credential'; // bypasses Google OAuth locally
const TEST_USER_ID = 'perf-test-user';
const CONTEXT = 'perf-test';
const SITE = 'perf-site';
const TARGET = 'perf-target';
const WARMUP_REQUESTS = 5;
const MEASURED_REQUESTS = 50;

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function post(path, body, userId = TEST_USER_ID) {
  const start = performance.now();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AUTH_HEADER}`,
      'User-Id': userId,
    },
    body: JSON.stringify(body),
  });
  const ms = performance.now() - start;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${path} → ${res.status}: ${text}`);
  }
  return { ms, data: await res.json() };
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------

function stats(times) {
  const sorted = [...times].sort((a, b) => a - b);
  const p = (pct) => sorted[Math.floor((pct / 100) * sorted.length)] ?? sorted[sorted.length - 1];
  return {
    min: sorted[0].toFixed(1),
    p50: p(50).toFixed(1),
    p90: p(90).toFixed(1),
    p95: p(95).toFixed(1),
    p99: p(99).toFixed(1),
    max: sorted[sorted.length - 1].toFixed(1),
    mean: (sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(1),
  };
}

function printStats(label, times) {
  const s = stats(times);
  console.log(`\n  ${label}`);
  console.log(`    min=${s.min}ms  mean=${s.mean}ms  p50=${s.p50}ms  p90=${s.p90}ms  p95=${s.p95}ms  p99=${s.p99}ms  max=${s.max}ms`);
}

// ---------------------------------------------------------------------------
// Test scenarios
// ---------------------------------------------------------------------------

async function runScenario(label, requestFn) {
  process.stdout.write(`\n[${label}] warming up (${WARMUP_REQUESTS} reqs)...`);
  for (let i = 0; i < WARMUP_REQUESTS; i++) {
    await requestFn();
    process.stdout.write('.');
  }

  process.stdout.write(`\n[${label}] measuring (${MEASURED_REQUESTS} reqs)...`);
  const times = [];
  for (let i = 0; i < MEASURED_REQUESTS; i++) {
    const { ms } = await requestFn();
    times.push(ms);
    process.stdout.write('.');
  }

  printStats(label, times);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(60));
  console.log('  Segment membership performance test');
  console.log(`  ${MEASURED_REQUESTS} measured requests per scenario`);
  console.log('='.repeat(60));

  // Register the test user (do this once; subsequent calls are upserts)
  console.log('\nRegistering test user via /v6/init...');
  await post('/v6/init', {
    group: { class: ['class-1'] },
    workingGroup: { class: 'class-1' },
  });
  console.log('  Done.');

  // --- Scenario 1: /assign with large inclusion segment ---
  // The test user IS in the 10k-member segment.
  // Old path: loads 10k members into memory, checks array.
  // New path: one EXISTS query against individual_for_segment.
  await runScenario('/v6/assign — large inclusion segment (user IS member)', () =>
    post('/v6/assign', {
      context: CONTEXT,
      site: SITE,
      target: TARGET,
    })
  );

  // --- Scenario 2: /featureflag with large exclusion segment ---
  // The test user IS in the 10k-member exclusion segment (EXCLUDE_ALL flag).
  // Old path: loads 10k members, finds user, excludes flag.
  // New path: one EXISTS query, returns false, flag excluded.
  await runScenario('/v6/featureflag — large exclusion segment (user IS member)', () =>
    post('/v6/featureflag', {
      context: CONTEXT,
    })
  );

  // Register non-member user before hitting assign
  await post('/v6/init', { group: {}, workingGroup: {} }, 'perf-nonmember-user');

  // --- Scenario 3: Non-member user ---
  // This user is NOT in any segment. Old path still loads all members to confirm absence.
  // New path: EXISTS returns false cheaply.
  await runScenario('/v6/assign — large segment (user NOT member)', () =>
    post('/v6/assign', {
      context: CONTEXT,
      site: SITE,
      target: TARGET,
    }, 'perf-nonmember-user')
  );

  await runScenario('/v6/featureflag — large segment (user NOT member)', () =>
    post('/v6/featureflag', {
      context: CONTEXT,
    }, 'perf-nonmember-user')
  );

  console.log('\n' + '='.repeat(60));
  console.log('  Done. Run against the other branch with the same data.');
  console.log('  To test cold cache: restart the server between runs.');
  console.log('  To test warm cache: run twice without restarting.');
  console.log('='.repeat(60) + '\n');
}

main().catch((err) => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
