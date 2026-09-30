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

export function startPerfDiagnostics(dataSource: DataSource, options: PerfDiagnosticsOptions = {}): () => void {
  // Pool counts are point-in-time, so they're sampled often enough to catch sub-second bursts.
  const { sampleMs = 100, reportMs = 10000, write = (line) => process.stdout.write(line + '\n') } = options;

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
