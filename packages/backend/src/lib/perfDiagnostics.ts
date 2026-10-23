import { constants, monitorEventLoopDelay, performance, PerformanceObserver } from 'perf_hooks';
import type { DataSource } from 'typeorm';
import { getInstanceId } from './instanceIdentity';
import { CustomEventAttributes, recordCustomEvent } from './newrelic';

/**
 * Runtime performance diagnostics for the backend: event loop, garbage collection, the pg connection
 * pool, and in-memory cache writes. Enabled only when PERF_DIAG_ENABLED=true; otherwise nothing here
 * is started or installed.
 *
 * Every 10 seconds it writes one JSON line tagged `perfdiag` to stdout — deliberately not through
 * UpgradeLogger, so the production `error` log level does not suppress it. Each line answers, for the
 * window since the previous line: was the event loop busy (CPU), did it stall (event-loop delay, GC
 * pauses), and did queries queue for a DB connection (pg pool waiters). The timers and perf_hooks
 * observers behind it run off the request path, so they cannot change how a request is handled.
 *
 * Fields, per reporting window:
 * - instanceId: which server process wrote the line — see instanceIdentity.
 * - eventLoopBusyPct: % of wall time the main JS thread was running code rather than idle-waiting on I/O.
 *   Near 100 means it's saturated and every ready callback (including every request) queues behind it.
 * - eventLoopDelayMs (p50/p99/max): how late a timer fired beyond its schedule — how long ready work sat
 *   waiting for the thread. The 10ms sampling interval is subtracted, so an idle loop reads ~0.
 * - garbageCollection.major/minor: GC pauses (count, total, longest) — major is mark-compact, minor is
 *   scavenge. Both stop the main thread; major pauses are the long ones. Incremental-marking and
 *   weak-callback steps aren't counted.
 * - dbPool.maxWaitingForConnection: most queries queued for a free pg connection at any 100ms sample.
 *   Above 0 = pool exhausted.
 * - dbPool.maxConnectionsInUse: peak checked-out connections at any sample (compare to dbPoolConfig.maxPoolSize).
 * - dbPool.currentPoolSize: connections open (in use + idle) at report time. Drops as idle ones time out or expire.
 * - dbPoolConfig: the pool settings as pg-pool resolved them (after its defaults), to confirm the TYPEORM_* env
 *   vars took. Static for the life of the process. keepAlive and keepAliveInitialDelayMillis have no pg-pool
 *   default, so they're null when unset; the delay has no effect unless keepAlive is true.
 *   dbPool and dbPoolConfig are both null if the TypeORM driver exposes no pg pool.
 * - cacheWrites: every in-memory cache write in the window, whatever its duration (count, total/longest time
 *   blocked, and the key of the longest). The memory store deep-clones every value on write, synchronously,
 *   so this is time the event loop was blocked copying cache values — see instrumentCacheStore.
 * - heapUsedMb: V8 heap in use at report time.
 *
 * Any single cache write at or above CACHE_WRITE_LOG_THRESHOLD_MS also gets its own `perfdiag-cache` line:
 * - instanceId: as above.
 * - key: the cache key, cut to its first 120 characters.
 * - kind: `miss` if the key held no live entry before the write (first load, or after it expired),
 *   `refresh` if the write replaced one.
 * - writeMs: how long the write blocked the event loop.
 * - loadMs: how long the source load took (DB round trip plus TypeORM hydration). Only CacheService.wrap's
 *   loader is timed, so it's null for writes from anywhere else, such as setCache or the batch-load path.
 * - items: the value's array length or object key count; null for anything else.
 *
 * Unlike the timers, the cache instrumentation can sit on the request path — it wraps the cache store's
 * `set` and CacheService.wrap's loader — but adds only a few timestamp reads and one extra store lookup
 * per write.
 *
 * Every line also carries `tag` and an ISO-8601 `ts`. When New Relic is on (USE_NEW_RELIC=true), each line
 * is also recorded as a New Relic custom event — `PerfDiag` for the window reports, `PerfDiagCacheWrite`
 * for the slow cache writes — so they can be charted next to transaction data. Same fields, minus `tag`
 * and `ts` (the event's own type and timestamp stand in for them). Event attributes must be flat, so
 * nested fields become dotted names: `eventLoopDelayMs.p99` reads the same in NRQL as in the log line.
 * Null fields are left off.
 */

interface GcStats {
  count: number;
  totalMs: number;
  maxMs: number;
}

interface PgPoolLike {
  totalCount: number;
  idleCount: number;
  waitingCount: number;
  options?: {
    max?: number;
    min?: number;
    idleTimeoutMillis?: number;
    maxLifetimeSeconds?: number;
    keepAlive?: boolean;
    keepAliveInitialDelayMillis?: number;
  };
}

type RecordEvent = (eventType: string, attributes: CustomEventAttributes) => void;

export interface PerfDiagnosticsOptions {
  sampleMs?: number;
  reportMs?: number;
  write?: (line: string) => void;
  recordEvent?: RecordEvent;
}

export const PERFDIAG_EVENT_TYPE = 'PerfDiag';
export const PERFDIAG_CACHE_EVENT_TYPE = 'PerfDiagCacheWrite';

// monitorEventLoopDelay samples on a timer of this resolution, and its recorded values include that
// interval — an idle loop reads ~10ms. Reported delays subtract it, so an idle loop reads ~0.
const LOOP_DELAY_RESOLUTION_MS = 10;

const emptyGcStats = (): GcStats => ({ count: 0, totalMs: 0, maxMs: 0 });
const round1 = (n: number): number => Math.round(n * 10) / 10;
const excessDelayMs = (ns: number): number => round1(Math.max(0, ns / 1e6 - LOOP_DELAY_RESOLUTION_MS));
const defaultWrite = (line: string): void => {
  process.stdout.write(line + '\n');
};

/**
 * Flattens a log-line payload into New Relic event attributes: nested objects become dotted names
 * (`{ dbPool: { currentPoolSize: 4 } }` → `dbPool.currentPoolSize: 4`) and null fields are dropped.
 */
export function toEventAttributes(fields: object, prefix = '', out: CustomEventAttributes = {}): CustomEventAttributes {
  for (const [key, value] of Object.entries(fields)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') {
      toEventAttributes(value, name, out);
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      out[name] = value;
    }
  }
  return out;
}

// ─── Cache write timing ───────────────────────────────────────────────────────

export const CACHE_WRITE_LOG_THRESHOLD_MS = 5;
const MAX_PENDING_LOADS = 1000;
const MAX_LOGGED_KEY_LENGTH = 120;

interface CacheWriteStats {
  count: number;
  totalMs: number;
  maxMs: number;
  maxKey: string | null;
}

interface CacheStoreLike {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, ttl?: number) => Promise<void>;
}

const emptyCacheWriteStats = (): CacheWriteStats => ({ count: 0, totalMs: 0, maxMs: 0, maxKey: null });
let cacheWrites = emptyCacheWriteStats();
// Source-load duration per key, recorded by timeCacheLoad and consumed by that key's next store write.
const pendingLoadMs = new Map<string, number>();

const countItems = (value: unknown): number | null => {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.keys(value).length;
  return null;
};

/**
 * Wraps a CacheService.wrap loader so the time it takes (DB round trip + TypeORM hydration) is
 * recorded against the key, to be reported alongside that key's store write.
 */
export function timeCacheLoad<T>(key: string, load: () => Promise<T>): () => Promise<T> {
  return () => {
    const start = performance.now();
    return load().finally(() => {
      if (pendingLoadMs.size >= MAX_PENDING_LOADS) pendingLoadMs.clear();
      pendingLoadMs.set(key, performance.now() - start);
    });
  };
}

/**
 * Times every write to the cache store. cache-manager's memory store deep-clones the value inside
 * `set` before storing it (lodash.cloneDeep, synchronous), so the time spent in the `set` call is time
 * the event loop was blocked. Mutates `store` in place.
 */
export function instrumentCacheStore(
  store: CacheStoreLike,
  write: (line: string) => void = defaultWrite,
  logThresholdMs = CACHE_WRITE_LOG_THRESHOLD_MS,
  recordEvent: RecordEvent = recordCustomEvent
): void {
  const originalSet = store.set.bind(store);
  store.set = (key: string, value: unknown, ttl?: number) => {
    // The memory store evaluates `get` synchronously, so this reflects the entry as it was before this write.
    const previous = store.get(key).catch(() => undefined);
    const start = performance.now();
    const result = originalSet(key, value, ttl);
    const writeMs = performance.now() - start;

    cacheWrites.count++;
    cacheWrites.totalMs += writeMs;
    if (writeMs > cacheWrites.maxMs) {
      cacheWrites.maxMs = writeMs;
      cacheWrites.maxKey = key.slice(0, MAX_LOGGED_KEY_LENGTH);
    }

    const loadMs = pendingLoadMs.get(key);
    pendingLoadMs.delete(key);
    if (writeMs >= logThresholdMs) {
      void previous.then((prior) => {
        try {
          const fields = {
            instanceId: getInstanceId(),
            key: key.slice(0, MAX_LOGGED_KEY_LENGTH),
            kind: prior === undefined ? 'miss' : 'refresh',
            writeMs: round1(writeMs),
            loadMs: loadMs === undefined ? null : round1(loadMs),
            items: countItems(value),
          };
          write(JSON.stringify({ tag: 'perfdiag-cache', ts: new Date().toISOString(), ...fields }));
          recordEvent(PERFDIAG_CACHE_EVENT_TYPE, toEventAttributes(fields));
        } catch {
          // Diagnostics must never take the process down.
        }
      });
    }
    return result;
  };
}

export function startPerfDiagnostics(dataSource: DataSource, options: PerfDiagnosticsOptions = {}): () => void {
  // Pool counts are point-in-time, so they're sampled often enough to catch sub-second bursts.
  const { sampleMs = 100, reportMs = 10000, write = defaultWrite, recordEvent = recordCustomEvent } = options;

  const loopDelay = monitorEventLoopDelay({ resolution: LOOP_DELAY_RESOLUTION_MS });
  loopDelay.enable();
  let lastElu = performance.eventLoopUtilization();

  let gcMajor = emptyGcStats();
  let gcMinor = emptyGcStats();
  const gcObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const gcKind = (entry as PerformanceEntry & { detail?: { kind?: number } }).detail?.kind;
      const stats =
        gcKind === constants.NODE_PERFORMANCE_GC_MAJOR
          ? gcMajor
          : gcKind === constants.NODE_PERFORMANCE_GC_MINOR
          ? gcMinor
          : undefined;
      if (!stats) continue;
      stats.count++;
      stats.totalMs += entry.duration;
      stats.maxMs = Math.max(stats.maxMs, entry.duration);
    }
  });
  gcObserver.observe({ entryTypes: ['gc'] });

  // TypeORM's postgres driver keeps its pg Pool on `master` (with replication configured, the primary's pool).
  const pool: PgPoolLike | undefined = (dataSource?.driver as unknown as { master?: PgPoolLike })?.master;
  let maxWaiting = 0;
  let maxInUse = 0;
  const sampleTimer = setInterval(() => {
    if (!pool) return;
    maxWaiting = Math.max(maxWaiting, pool.waitingCount);
    maxInUse = Math.max(maxInUse, pool.totalCount - pool.idleCount);
  }, sampleMs);
  sampleTimer.unref();

  const reportTimer = setInterval(() => {
    try {
      const elu = performance.eventLoopUtilization(lastElu);
      lastElu = performance.eventLoopUtilization();
      const formatGc = (stats: GcStats) => ({
        count: stats.count,
        totalMs: round1(stats.totalMs),
        maxMs: round1(stats.maxMs),
      });

      const fields = {
        instanceId: getInstanceId(),
        eventLoopBusyPct: round1(elu.utilization * 100),
        eventLoopDelayMs: {
          p50: excessDelayMs(loopDelay.percentile(50)),
          p99: excessDelayMs(loopDelay.percentile(99)),
          max: excessDelayMs(loopDelay.max),
        },
        garbageCollection: { major: formatGc(gcMajor), minor: formatGc(gcMinor) },
        dbPool: pool
          ? {
              maxWaitingForConnection: maxWaiting,
              maxConnectionsInUse: maxInUse,
              currentPoolSize: pool.totalCount,
            }
          : null,
        dbPoolConfig: pool
          ? {
              maxPoolSize: pool.options?.max ?? null,
              minPoolSize: pool.options?.min ?? null,
              idleTimeoutMillis: pool.options?.idleTimeoutMillis ?? null,
              maxLifetimeSeconds: pool.options?.maxLifetimeSeconds ?? null,
              keepAlive: pool.options?.keepAlive ?? null,
              keepAliveInitialDelayMillis: pool.options?.keepAliveInitialDelayMillis ?? null,
            }
          : null,
        cacheWrites: {
          count: cacheWrites.count,
          totalMs: round1(cacheWrites.totalMs),
          maxMs: round1(cacheWrites.maxMs),
          maxKey: cacheWrites.maxKey,
        },
        heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1048576),
      };
      write(JSON.stringify({ tag: 'perfdiag', ts: new Date().toISOString(), ...fields }));
      recordEvent(PERFDIAG_EVENT_TYPE, toEventAttributes(fields));
    } catch {
      // Diagnostics must never take the process down.
    } finally {
      loopDelay.reset();
      gcMajor = emptyGcStats();
      gcMinor = emptyGcStats();
      maxWaiting = 0;
      maxInUse = 0;
      cacheWrites = emptyCacheWriteStats();
    }
  }, reportMs);
  reportTimer.unref();

  return () => {
    clearInterval(sampleTimer);
    clearInterval(reportTimer);
    gcObserver.disconnect();
    loopDelay.disable();
  };
}
