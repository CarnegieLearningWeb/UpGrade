#!/usr/bin/env node
/**
 * Drive and observe the valid-experiments cache across several backend instances.
 *
 * Companion to scripts/cache-demo.sh, which starts the instances. No new dependencies — global
 * fetch plus the `pg` module the backend already depends on.
 *
 * Commands:
 *   init       create the demo experiment user (once; all instances share one database)
 *   traffic    round-robin /v6/assign across the instances. This is what populates and refreshes
 *              the cache — nothing else does.
 *   watch      poll each instance's cache-debug endpoint and print a per-instance fingerprint, so
 *              divergence between instances shows up as differing hashes
 *   converge   change an experiment in the database, then measure how long each instance takes to
 *              reflect it. Generates traffic while measuring, because a background refresh only
 *              ever fires on a cache hit.
 *
 * The observer (GET /api/experiments/cache) reads the store directly instead of going through
 * wrap(), so watching never triggers a refresh and never perturbs what it measures.
 *
 * The change is applied with plain SQL rather than through the admin API on purpose: no instance
 * gets a local cache invalidation, so all of them are equally stale and every instance has to
 * notice on its own refresh cycle. That isolates the mechanism being demoed.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BACKEND_DIR = join(REPO_ROOT, 'packages', 'backend');
const EXPERIMENT_BUCKET = 'EXPERIMENT_KEY_PREFIX';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ------------------------------------------------------------ backend .env

/** Minimal .env reader — we only need a handful of keys and don't want a dotenv import here. */
function readBackendEnv() {
  const text = readFileSync(join(BACKEND_DIR, '.env'), 'utf8');
  const values = {};
  for (const line of text.split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) values[match[1]] = match[2].trim();
  }
  return values;
}

function configuredContexts(backendEnv) {
  try {
    return Object.keys(JSON.parse(backendEnv.CONTEXT_METADATA));
  } catch {
    return [];
  }
}

/**
 * Pick a context that actually has cacheable experiments, not just the first one in
 * CONTEXT_METADATA. An empty context caches an empty array, which is valid but demos nothing.
 * Prefers the configured context with the most enrolling / enrollment-complete experiments.
 */
async function detectContext(backendEnv) {
  const configured = configuredContexts(backendEnv);
  if (configured.length === 0) return null;
  try {
    const rows = await withDb(backendEnv, (client) =>
      client
        .query(
          `select unnest(context) as context, count(*)::int as total
             from experiment
            where state in ('enrolling', 'enrollmentComplete')
         group by 1 order by 2 desc`
        )
        .then((result) => result.rows)
    );
    const best = rows.find((row) => configured.includes(row.context));
    if (best) return best.context;
  } catch {
    // No database reachable — fall back to configuration alone.
  }
  return configured[0];
}

// ------------------------------------------------------------------ http calls

async function postJson(url, body, headers) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`${response.status} ${(await response.text()).slice(0, 160)}`);
  }
  return response.status === 204 ? null : response.json();
}

const initUser = (instance, userId) => postJson(`${instance}/api/v6/init`, {}, { 'User-Id': userId });

/** One request down the cached read path (ExperimentService.getCachedValidExperiments). */
const assign = (instance, userId, context) => postJson(`${instance}/api/v6/assign`, { context }, { 'User-Id': userId });

// --------------------------------------------------------- cache fingerprints

/**
 * Order-insensitive canonical serialization: object keys sorted, array elements sorted by their own
 * serialization. Two payloads hash the same only if they hold the same data.
 *
 * The fingerprint covers the WHOLE cached experiment, not a chosen few fields. An edit to conditions,
 * decision points, segments, enrollment criteria or description has to move the hash — otherwise
 * watching a UI edit shows nothing and looks like the cache never refreshed. `updatedAt` and
 * `versionNumber` are in there too, so any write that touches the experiment row registers.
 */
function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).sort().join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/**
 * GET the cache report. Counts only unless `data` is asked for — the full payloads are megabytes, so
 * a watch loop that pulled them every second would perturb the thing it is measuring.
 */
async function cacheReport(instance, { prefix = null, data = false } = {}) {
  const query = new URLSearchParams();
  if (prefix) query.set('prefix', prefix);
  if (data) query.set('data', 'true');
  const suffix = query.size ? `?${query}` : '';
  const response = await fetch(`${instance}/api/experiments/cache${suffix}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/** The entries the report returned for one prefix bucket: [{ key, expiresInSeconds, data? }]. */
const bucketEntries = (report, bucket) => report?.summary?.[bucket]?.keys ?? [];

/**
 * Summarize one instance's cached valid-experiments for `context`.
 * state is 'hash' | 'absent' | 'error'; 'absent' means cold — expired, evicted, or never populated.
 */
async function fingerprint(instance, context) {
  let report;
  try {
    report = await cacheReport(instance, { prefix: EXPERIMENT_BUCKET, data: true });
  } catch (err) {
    return { state: 'error', detail: String(err.message).slice(0, 40), totalKeys: null, instanceId: null };
  }

  // totalKeys is worth carrying: if it pins at CACHING_MAX_KEYS the store is evicting, and mark keys
  // share the experiments bucket, so under load they can push valid-experiments out.
  // instanceId comes from the process, not the address — the identity survives a round-robin and
  // changes only when the process is replaced.
  const common = { totalKeys: report?.totalKeysInCache ?? null, instanceId: report?.instanceId ?? null };
  const prefix = report?.summary?.[EXPERIMENT_BUCKET]?.prefix ?? '';
  const entry = bucketEntries(report, EXPERIMENT_BUCKET).find((item) => item.key === prefix + context);
  if (!entry) return { state: 'absent', detail: '-', ...common };

  const experiments = entry.data ?? [];
  const digest = createHash('sha1').update(canonical(experiments)).digest('hex').slice(0, 8);
  // `detail` stays the comparison key everywhere; count and digest exist so the renderer never has
  // to parse it back apart.
  return {
    state: 'hash',
    detail: `${experiments.length}exp:${digest}`,
    count: experiments.length,
    digest,
    expiresInSeconds: entry.expiresInSeconds,
    ...common,
  };
}

const snapshot = (instances, context) => Promise.all(instances.map((i) => fingerprint(i, context)));

// ------------------------------------------------------------------- rendering

const RULE = '─'.repeat(34);

/** ':3040' for a local instance, host:port otherwise — enough to tell instances apart at a glance. */
function shortName(url) {
  try {
    const { hostname, port } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' ? `:${port}` : `${hostname}:${port}`;
  } catch {
    return url;
  }
}

function describe(entry) {
  if (entry.state === 'error') return `unreachable — ${entry.detail}`;
  if (entry.state === 'absent') return 'cold — nothing cached';
  const experiments = `${entry.count} experiment${entry.count === 1 ? '' : 's'}`;
  return `${experiments.padEnd(15)}fingerprint ${entry.digest}`;
}

/**
 * One block per poll: a ruled header, then one line per instance. Long observe runs get read by
 * scrolling, so the divider and the blank line between blocks carry as much weight as the numbers.
 */
function renderBlock(snap, { instances, heading = '', events = [], showKeys = false }) {
  const eventFor = new Map(events.map((event) => [event.index, event.text]));
  const nameWidth = Math.max(...instances.map((url) => shortName(url).length));
  const lines = [heading ? `${RULE}  ${heading}` : RULE];

  snap.forEach((entry, index) => {
    // Address and identity are different facts: the address is where we sent the request, the id is
    // which process answered. Locally they track each other; behind a load balancer only the id means
    // anything, and a changed id is a restarted process rather than a colder cache.
    const name = shortName(instances[index]).padEnd(nameWidth);
    const id = (entry.instanceId ?? '?'.repeat(8)).padEnd(8);
    const keys = showKeys && entry.totalKeys != null ? `   ${entry.totalKeys} keys cached` : '';
    const event = eventFor.has(index) ? `   <- ${eventFor.get(index)}` : '';
    lines.push(`  instance ${index + 1}   ${name}  ${id}  ${describe(entry).padEnd(36)}${keys}${event}`.trimEnd());
  });
  return lines.join('\n');
}

/**
 * Label what moved between two snapshots, so a long log says why a block differs from the last.
 *
 * `lastIds` holds the last id each instance reported, which is deliberately not the same as the
 * previous snapshot's: a restart is normally observed as reachable -> unreachable -> reachable, and
 * the poll on either side of the gap is the only pair that shows the id changing.
 */
function diffEvents(previous, current, lastIds = new Map()) {
  if (!previous) return [];
  const events = [];
  current.forEach((entry, index) => {
    const before = previous[index];
    const lastId = lastIds.get(index);
    // Checked first: a new process explains an empty cache that would otherwise read as an eviction.
    if (lastId && entry.instanceId && lastId !== entry.instanceId) {
      events.push({ index, text: `RESTARTED (new process ${entry.instanceId})` });
    } else if (before.state === 'error' && entry.state !== 'error') {
      events.push({ index, text: 'reachable again' });
    } else if (before.state === 'hash' && entry.state === 'hash' && before.detail !== entry.detail) {
      events.push({ index, text: 'changed' });
    } else if (before.state === 'hash' && entry.state === 'absent') {
      events.push({ index, text: 'WENT COLD' });
    } else if (before.state === 'absent' && entry.state === 'hash') {
      events.push({ index, text: 'warmed' });
    } else if (before.state !== 'error' && entry.state === 'error') {
      events.push({ index, text: 'became unreachable' });
    }
  });
  return events;
}

const eventSentence = (event) => `instance ${event.index + 1} ${event.text}`;

// ----------------------------------------------------------------- traffic gen

/** Round-robin /v6/assign at a fixed total rate, one request per tick. */
function startTraffic({ instances, userId, context, rps }) {
  const state = { sent: 0, failed: 0, lastError: null, running: rps > 0 };
  const loop = (async () => {
    let index = 0;
    while (state.running) {
      const instance = instances[index++ % instances.length];
      try {
        await assign(instance, userId, context);
        state.sent++;
      } catch (err) {
        state.failed++;
        state.lastError = err.message;
      }
      await sleep(1000 / rps);
    }
  })();
  return { stats: state, stop: async () => ((state.running = false), loop) };
}

// ------------------------------------------------------------------- database

async function withDb(backendEnv, fn) {
  // `pg` is hoisted to the workspace root by yarn; resolve it from the backend package.
  const require = createRequire(join(BACKEND_DIR, '/'));
  const { Client } = require('pg');
  const client = new Client({
    host: backendEnv.TYPEORM_HOST,
    port: Number(backendEnv.TYPEORM_PORT),
    user: backendEnv.TYPEORM_USERNAME,
    password: backendEnv.TYPEORM_PASSWORD || undefined,
    database: backendEnv.TYPEORM_DATABASE,
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/** The experiment ids actually present in an instance's cached payload for `context`. */
async function cachedExperimentIds(instance, context) {
  try {
    const report = await cacheReport(instance, { prefix: EXPERIMENT_BUCKET, data: true });
    const prefix = report?.summary?.[EXPERIMENT_BUCKET]?.prefix ?? '';
    const entry = bucketEntries(report, EXPERIMENT_BUCKET).find((item) => item.key === prefix + context);
    return (entry?.data ?? []).map((exp) => exp.id);
  } catch {
    return [];
  }
}

/** Which valid-experiments keys an instance currently holds, whatever the context. */
async function cachedContexts(instance) {
  try {
    const report = await cacheReport(instance, { prefix: EXPERIMENT_BUCKET, data: true });
    const prefix = report?.summary?.[EXPERIMENT_BUCKET]?.prefix ?? '';
    return {
      instanceId: report?.instanceId ?? null,
      entries: bucketEntries(report, EXPERIMENT_BUCKET).map((item) => ({
        context: item.key.replace(prefix, ''),
        count: (item.data ?? []).length,
        expiresInSeconds: item.expiresInSeconds,
      })),
    };
  } catch {
    return null;
  }
}

/**
 * Rename one experiment. Renaming is visible in the cached payload but changes no assignment
 * behavior, so it's a safe stand-in for "an admin edited something."
 *
 * The target is taken from what's actually cached rather than chosen by SQL: getValidExperiments
 * filters more narrowly than `state in ('enrolling','enrollmentComplete')` (it drops
 * enrollment-complete experiments whose post-rule is assign with no revertTo), so picking by SQL can
 * land on an experiment that never appears in the payload — a change nothing can observe.
 */
async function applyDemoChange(backendEnv, experimentId) {
  return withDb(backendEnv, async (client) => {
    const found = await client.query(`select id, name from experiment where id = $1`, [experimentId]);
    if (found.rowCount === 0) return null;
    const { id, name } = found.rows[0];
    const next = `cache-demo ${new Date().toISOString().slice(11, 19)}`;
    await client.query(`update experiment set name = $1 where id = $2`, [next, id]);
    return { id, from: name, to: next };
  });
}

// -------------------------------------------------------------------- commands

async function cmdInit({ instances, userId }) {
  for (const instance of instances) {
    try {
      await initUser(instance, userId);
      console.log(`  demo user '${userId}' created via ${instance}`);
      return 0;
    } catch (err) {
      console.log(`  ${instance}  ${err.message}`);
    }
  }
  console.error('could not init the demo user on any instance');
  return 1;
}

async function cmdTraffic({ instances, userId, context, rps, duration }) {
  console.log(`traffic: ${rps} req/s round-robin across ${instances.length} instances`);
  console.log(`         context=${context}  duration=${duration}s   (ctrl-c to stop)`);
  const traffic = startTraffic({ instances, userId, context, rps });
  await sleep(duration * 1000);
  await traffic.stop();
  console.log(`sent=${traffic.stats.sent} failed=${traffic.stats.failed}`);
  if (traffic.stats.lastError) console.log(`last error: ${traffic.stats.lastError}`);
  return traffic.stats.sent > 0 ? 0 : 1;
}

async function cmdWatch({ instances, userId, context, rps, interval, duration, format, keys }) {
  const traffic = rps > 0 ? startTraffic({ instances, userId, context, rps }) : null;
  const jsonl = format === 'jsonl';

  if (!jsonl) {
    if (traffic) console.log(`\n(generating ${rps} req/s in the background)`);
    else console.log('\n(no synthetic traffic — relying on whatever else is driving these instances)');
    console.log(`watching context '${context}' — edits to experiments in OTHER contexts will not show here.`);
    console.log('');
    console.log('  Instances holding the same fingerprint agree on what is cached.');
    console.log('  The 8-character id is the process that answered — it changes only on a restart.');
    console.log('  "cold" means the entry is absent: expired, evicted, or never populated.');
    console.log('  Anything that moved since the previous poll is called out at the end of its line.');
    if (keys) console.log('  "N keys cached" is the whole store — pinned at CACHING_MAX_KEYS means eviction.');
    console.log('');
    console.log(`polling every ${interval}s${duration > 0 ? ` for ${duration}s` : ' until ctrl-c'}`);
  }

  const started = Date.now();
  let previous = null;
  const lastIds = new Map();
  // duration 0 runs until interrupted — the usual case when shadowing a load test of unknown length.
  while (duration <= 0 || Date.now() - started < duration * 1000) {
    const snap = await snapshot(instances, context);
    const events = diffEvents(previous, snap, lastIds);
    snap.forEach((entry, index) => entry.instanceId && lastIds.set(index, entry.instanceId));
    const stamp = new Date().toISOString();

    if (jsonl) {
      // One self-describing record per poll, with a wall-clock stamp to line up against load-test
      // metrics after the fact.
      console.log(
        JSON.stringify({
          ts: stamp,
          context,
          instances: snap.map((entry, index) => ({
            instance: index + 1,
            url: instances[index],
            // The id, not the url, is what identifies the process across a restart or behind a load
            // balancer — group by it when correlating these records with anything else.
            instanceId: entry.instanceId,
            state: entry.state,
            fingerprint: entry.state === 'hash' ? entry.detail : null,
            expiresInSeconds: entry.expiresInSeconds ?? null,
            totalKeys: entry.totalKeys,
          })),
          events: events.map(eventSentence),
        })
      );
    } else {
      const elapsed = `t+${((Date.now() - started) / 1000).toFixed(1).padStart(7)}s`;
      console.log('');
      console.log(
        renderBlock(snap, { instances, heading: `${stamp.slice(11, 19)}   ${elapsed}`, events, showKeys: keys })
      );
    }

    previous = snap;
    await sleep(interval * 1000);
  }
  if (traffic) await traffic.stop();
  return 0;
}

/**
 * Measure how often the experiment queries actually run, by diffing pg_stat_statements over a window.
 * This is the empirical version of "refresh queries per second" — the number the cache exists to keep
 * down. Compare it against instances x contexts / refreshInterval.
 *
 * Caveat printed for the user: pg_stat_statements is database-wide, so it counts every client on this
 * database — the demo fleet, any other dev server, and the load generator itself.
 */
async function cmdRefreshes({ backendEnv, window: windowSeconds }) {
  const sample = () =>
    withDb(backendEnv, (client) =>
      client
        .query(
          `select queryid, calls, mean_exec_time, query
             from pg_stat_statements
            where query ilike '%from "experiment"%'
              and query not ilike '%pg_stat_statements%'`
        )
        .then((result) => new Map(result.rows.map((row) => [String(row.queryid), row])))
    );

  console.log(`sampling pg_stat_statements over ${windowSeconds}s...`);
  const before = await sample();
  await sleep(windowSeconds * 1000);
  const after = await sample();

  const deltas = [];
  for (const [queryid, row] of after) {
    const previousCalls = Number(before.get(queryid)?.calls ?? 0);
    const delta = Number(row.calls) - previousCalls;
    if (delta > 0) deltas.push({ delta, meanMs: Number(row.mean_exec_time), query: row.query });
  }
  deltas.sort((a, b) => b.delta - a.delta);

  if (deltas.length === 0) {
    console.log('\nno experiment queries ran in that window — nothing is refreshing (or nothing is');
    console.log('driving traffic). With a long TTL and no traffic, that is the expected steady state.');
    return 0;
  }

  const total = deltas.reduce((sum, row) => sum + row.delta, 0);
  console.log(`\n${total} experiment queries in ${windowSeconds}s = ${(total / windowSeconds).toFixed(2)}/s\n`);
  for (const row of deltas.slice(0, 8)) {
    const shape = row.query.replace(/\s+/g, ' ').slice(0, 90);
    console.log(`  ${String(row.delta).padStart(5)} calls  ${row.meanMs.toFixed(1).padStart(7)}ms avg  ${shape}`);
  }
  console.log('\nNOTE: database-wide — includes every client on this database, not just the demo fleet.');
  return 0;
}

/** Where the fleet's cached experiments actually are, and where the database has candidates. */
async function cmdContexts({ instances, backendEnv }) {
  console.log('cached right now (only contexts that have received traffic appear):');
  for (const [index, instance] of instances.entries()) {
    const report = await cachedContexts(instance);
    const label = `  instance ${index + 1}   ${shortName(instance).padEnd(6)}  ${(
      report?.instanceId ?? '?'.repeat(8)
    ).padEnd(8)}`;
    if (report === null) {
      console.log(`${label}  unreachable`);
    } else if (report.entries.length === 0) {
      console.log(`${label}  (nothing cached)`);
    } else {
      const cached = report.entries
        .map((e) => `${e.context} = ${e.count} experiments, expires in ${e.expiresInSeconds}s`)
        .join('\n'.padEnd(label.length + 3));
      console.log(`${label}  ${cached}`);
    }
  }

  const configured = configuredContexts(backendEnv);
  try {
    const rows = await withDb(backendEnv, (client) =>
      client
        .query(
          `select unnest(context) as context, count(*)::int as total
             from experiment
            where state in ('enrolling', 'enrollmentComplete')
         group by 1 order by 2 desc`
        )
        .then((result) => result.rows)
    );
    console.log('\ncacheable experiments in the database:');
    for (const row of rows) {
      const usable = configured.includes(row.context);
      console.log(
        `  ${row.context.padEnd(24)} ${String(row.total).padStart(3)} experiments${
          usable ? '' : '   (not in CONTEXT_METADATA — assign would reject it)'
        }`
      );
    }
    console.log('\nwatch a specific one with:  ./scripts/cache-demo.sh watch --context <name>');
  } catch (err) {
    console.log(`\ncould not read the database: ${err.message}`);
  }
  return 0;
}

async function cmdConverge(options) {
  const { instances, userId, context, rps, warmup, interval, timeout, changeCmd, backendEnv } = options;
  const traffic = startTraffic({ instances, userId, context, rps });

  console.log(`warming caches (${rps} req/s, up to ${warmup}s)...`);
  const warmDeadline = Date.now() + warmup * 1000;
  while (Date.now() < warmDeadline) {
    const snap = await snapshot(instances, context);
    if (snap.every((entry) => entry.state === 'hash')) break;
    await sleep(1000);
  }

  const before = await snapshot(instances, context);
  console.log('\ncache state before the change:');
  console.log(renderBlock(before, { instances }));

  const cold = before.map((e, i) => (e.state === 'hash' ? null : i + 1)).filter(Boolean);
  if (cold.length) {
    console.log(`\ninstances ${cold.join(', ')} never populated.`);
    if (traffic.stats.sent === 0) {
      console.log(`no assign call succeeded. last error: ${traffic.stats.lastError}`);
      console.log(`check that context '${context}' is valid and the demo user exists (run: init).`);
    }
    await traffic.stop();
    return 1;
  }

  let change;
  if (changeCmd) {
    console.log(`\napplying change: ${changeCmd}`);
    const result = await new Promise((resolve) =>
      exec(changeCmd, (error, stdout, stderr) => resolve({ error, stdout, stderr }))
    );
    if (result.error) {
      console.error(`change failed: ${result.stderr.trim() || result.error.message}`);
      await traffic.stop();
      return 1;
    }
    change = result.stdout.trim();
  } else {
    const [targetId] = await cachedExperimentIds(instances[0], context);
    if (!targetId) {
      console.log(`\nNothing cached for context '${context}' — no experiment to change.`);
      console.log('The cache only holds enrolling / enrollment-complete experiments. Create and');
      console.log('start one in the UI, then re-run.');
      await traffic.stop();
      return 1;
    }
    const renamed = await applyDemoChange(backendEnv, targetId);
    if (!renamed) {
      console.log(`\nExperiment ${targetId} vanished from the database mid-run.`);
      await traffic.stop();
      return 1;
    }
    change = `renamed ${renamed.id}\n  '${renamed.from}' -> '${renamed.to}'`;
  }
  const tZero = Date.now();
  console.log(`\nchanged directly in postgres, so no instance invalidated locally:\n  ${change}`);

  console.log(`\nwatching for propagation (timeout ${timeout}s)...\n`);
  const converged = new Map();
  while (Date.now() - tZero < timeout * 1000 && converged.size < instances.length) {
    const snap = await snapshot(instances, context);
    snap.forEach((entry, index) => {
      if (converged.has(index)) return;
      // Differs from its own pre-change value => this instance has re-read the database.
      if (entry.state === 'hash' && entry.detail !== before[index].detail) {
        const seconds = (Date.now() - tZero) / 1000;
        converged.set(index, seconds);
        console.log(`  instance ${index + 1} picked it up at t+${seconds.toFixed(1)}s`);
      }
    });
    await sleep(interval * 1000);
  }
  await traffic.stop();

  console.log('\ncache state after the change:');
  console.log(renderBlock(await snapshot(instances, context), { instances }));
  console.log('\n--- results ---');
  instances.forEach((_, index) => {
    const seconds = converged.get(index);
    console.log(
      `  instance ${index + 1}: ${seconds === undefined ? `never (within ${timeout}s)` : `${seconds.toFixed(1)}s`}`
    );
  });
  if (converged.size === instances.length) {
    console.log(`\n  fleet-wide propagation delay: ${Math.max(...converged.values()).toFixed(1)}s`);
    console.log('  (expected: about CACHING_REFRESH_THRESHOLD, independent of the TTL)');
  } else {
    console.log('\n  fleet did NOT fully converge within the timeout.');
  }
  return 0;
}

// ------------------------------------------------------------------------ main

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    instances: { type: 'string' },
    context: { type: 'string' },
    user: { type: 'string', default: 'cache-demo-user' },
    rps: { type: 'string', default: '2' },
    interval: { type: 'string', default: '1' },
    duration: { type: 'string', default: '120' },
    warmup: { type: 'string', default: '30' },
    timeout: { type: 'string', default: '180' },
    'change-cmd': { type: 'string' },
    format: { type: 'string', default: 'text' },
    keys: { type: 'boolean', default: false },
    window: { type: 'string', default: '60' },
  },
});

const backendEnv = readBackendEnv();
const context = values.context || (await detectContext(backendEnv));
if (!context) {
  console.error('could not determine a context — pass --context, or check CONTEXT_METADATA in packages/backend/.env');
  process.exit(1);
}
// Anything on stdout that isn't a record would corrupt a jsonl stream being piped to a file.
if (!values.context && values.format !== 'jsonl') console.log(`context: ${context} (auto-detected)`);

const options = {
  backendEnv,
  context,
  instances: (values.instances ?? '3040,3041,3042,3043')
    .split(',')
    .map((part) => (part.includes('://') ? part : `http://localhost:${part.trim()}`)),
  userId: values.user,
  rps: Number(values.rps),
  interval: Number(values.interval),
  duration: Number(values.duration),
  warmup: Number(values.warmup),
  timeout: Number(values.timeout),
  changeCmd: values['change-cmd'],
  format: values.format,
  keys: values.keys,
  window: Number(values.window),
};

const commands = {
  init: cmdInit,
  traffic: cmdTraffic,
  watch: cmdWatch,
  converge: cmdConverge,
  contexts: cmdContexts,
  refreshes: cmdRefreshes,
};
const command = commands[positionals[0]];
if (!command) {
  console.error(`usage: cache-demo.mjs <${Object.keys(commands).join('|')}> [options]`);
  process.exit(1);
}
process.exit(await command(options));
