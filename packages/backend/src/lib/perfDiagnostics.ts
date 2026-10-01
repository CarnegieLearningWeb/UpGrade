import { constants, monitorEventLoopDelay, performance, PerformanceObserver } from 'perf_hooks';
import type { DataSource } from 'typeorm';
import { getInstanceId } from './instanceIdentity';

/**
 * TEMPORARY production diagnostics for the /assign + /mark tail-latency investigation.
 * Remove once that investigation is closed.
 *
 * Everything here runs off the request path (timers and perf_hooks observers only), so it cannot
 * change how a request is handled. Every `reportMs` it writes one JSON line tagged `perfdiag` to
 * stdout — deliberately not through UpgradeLogger, so the production `error` log level does not
 * suppress it. Each line answers, for that window: was the event loop busy (CPU), did it stall
 * (event-loop delay, GC pauses), and did requests queue for a DB connection (pg pool waiters).
 *
 * Fields, per reporting window:
 * - eventLoopBusyPct: % of wall time the main JS thread was running code rather than idle-waiting on I/O.
 *   Near 100 means it's saturated and every ready callback (including every request) queues behind it.
 * - eventLoopDelayMs: how late a timer fired beyond its schedule — how long ready work sat waiting for the thread.
 * - garbageCollection.major/minor: GC pauses (count, total, longest). Major pauses block the thread.
 * - dbPool.maxWaitingForConnection: most queries queued for a free pg connection at any sample. Above 0 = pool exhausted.
 * - dbPool.maxConnectionsInUse / poolSize: peak checked-out connections vs. the configured pool limit.
 * - cacheWrites: in-memory cache writes in the window (count, total/longest time blocked, and the key of
 *   the longest). The memory store deep-clones every value on write, synchronously, so this is time the
 *   event loop was blocked copying cache values — see instrumentCacheStore.
 *
 * Any single cache write at or above CACHE_WRITE_LOG_THRESHOLD_MS also gets its own `perfdiag-cache`
 * line: the key, whether it was a first load (`miss`) or a refresh of an existing entry, how long the
 * write blocked, and how long the source load took (DB round trip plus TypeORM hydration).
 *
 * Unlike the timers above, the cache instrumentation does sit on the request path — it wraps the cache
 * store's `set` and CacheService.wrap's loader — but only adds a timestamp read per call.
 *
 * Enabled only when PERF_DIAG_ENABLED=true.
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
  options?: { max?: number };
}

export interface PerfDiagnosticsOptions {
  sampleMs?: number;
  reportMs?: number;
  write?: (line: string) => void;
}

// monitorEventLoopDelay samples on a timer of this resolution, and its recorded values include that
// interval — an idle loop reads ~10ms. Reported delays subtract it, so an idle loop reads ~0.
const LOOP_DELAY_RESOLUTION_MS = 10;

const emptyGcStats = (): GcStats => ({ count: 0, totalMs: 0, maxMs: 0 });
const round1 = (n: number): number => Math.round(n * 10) / 10;
const excessDelayMs = (ns: number): number => round1(Math.max(0, ns / 1e6 - LOOP_DELAY_RESOLUTION_MS));
const defaultWrite = (line: string): void => {
  process.stdout.write(line + '\n');
};

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
  logThresholdMs = CACHE_WRITE_LOG_THRESHOLD_MS
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
          write(
            JSON.stringify({
              tag: 'perfdiag-cache',
              ts: new Date().toISOString(),
              instanceId: getInstanceId(),
              key: key.slice(0, MAX_LOGGED_KEY_LENGTH),
              kind: prior === undefined ? 'miss' : 'refresh',
              writeMs: round1(writeMs),
              loadMs: loadMs === undefined ? null : round1(loadMs),
              items: countItems(value),
            })
          );
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
  const { sampleMs = 100, reportMs = 10000, write = defaultWrite } = options;

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

  // TypeORM's postgres driver exposes the underlying pg Pool as `master` when using replication config.
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

      write(
        JSON.stringify({
          tag: 'perfdiag',
          ts: new Date().toISOString(),
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
                poolSize: pool.options?.max ?? null,
              }
            : null,
          cacheWrites: {
            count: cacheWrites.count,
            totalMs: round1(cacheWrites.totalMs),
            maxMs: round1(cacheWrites.maxMs),
            maxKey: cacheWrites.maxKey,
          },
          heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1048576),
        })
      );
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
