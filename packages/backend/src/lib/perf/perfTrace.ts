import { AsyncLocalStorage } from 'async_hooks';
import { performance } from 'perf_hooks';
import type { NextFunction, Request, Response } from 'express';
import { createLogger, format, transports, type Logger } from 'winston';
import SplunkStreamEvent from 'winston-splunk-httplogger';
import type TransportStream from 'winston-transport';
// Imported for its side effect only: env.ts runs dotenv.config(), which must happen before the
// SPLUNK_* reads below. Config is read straight from process.env rather than through the typed
// env module so this harness stays a single self-contained file — teardown deletes this file and
// unpicks one middleware registration, with no edits to shared config to unwind.
import '../../env';

/**
 * TEMPORARY request-correlated performance tracing. Installed by /setup-perftrace, removed by
 * /teardown-perftrace. Not intended to be committed or maintained.
 *
 * Every span logs the id of the request it belongs to, how many traced requests were in flight when
 * it closed, and its start/end marks on the shared `performance.now()` monotonic clock. Because all
 * spans in a process share that one clock, marks from concurrent requests are directly comparable —
 * which is what makes the output diagnostic rather than merely descriptive:
 *
 *   - A stop-the-world stall (major GC, a long synchronous block) delays every request awaiting at
 *     that instant. Several requests with overlapping windows all inflate and land on nearly the
 *     same `end` mark.
 *   - Connection-pool queueing delays only the request that had to wait for a connection. One
 *     duration inflates while `inflight` shows peers that finished normally.
 *
 * Output brackets each request so boundaries are findable in a busy log:
 *
 *   [perf] ┌───── req=005w inflight=2 start=243915.094 POST /api/v6/assign
 *   [perf] │ req=005w inflight=2 dur=1.204ms start=… end=… span=UserCheckMiddleware.getUserDoc
 *   [perf] └───── req=005w inflight=2 dur=21.412ms start=… end=… POST /api/v6/assign
 *
 * ── TWO DELIBERATE DEVIATIONS FROM THE REFERENCE HARNESS ──────────────────────────────────────
 *
 * 1. Config is HARDCODED in CONFIG below rather than read from PERF_TRACE_* env vars, so this
 *    branch can be deployed to the testing environment without adding anything to the CI/CD env
 *    var set. Each key may still be overridden by its env var if one happens to be present (an ECS
 *    task-definition override, say), but nothing needs to be.
 *
 * 2. Output goes through WINSTON, not console.log. The reference writes to stdout, which reaches a
 *    terminal and CloudWatch but never reaches Splunk — the Splunk transport is a winston transport
 *    and only ever sees what winston emits. Since Splunk is the sink here, stdout-only tracing
 *    would have produced nothing at all.
 *
 * The rendered line is byte-identical to the reference format, so output stays diffable against
 * previous runs. Each event additionally carries structured fields (perfTrace, kind, req, span,
 * durMs, …) so Splunk can aggregate rather than only grep — see "Reading this in Splunk" below.
 *
 * Reading this in Splunk:
 *   perfTrace=true                           every line from this harness, and nothing else
 *   perfTrace=true kind=close                one event per request, with the total
 *   perfTrace=true kind=span | stats avg(durMs) p95(durMs) count by span
 *
 * The ┌/└ envelope is emitted for every traced request. The threshold applies only to the child
 * spans in between, so a fast request collapses to just its two envelope lines. Keep the threshold
 * above zero under load: every emitted line is work on the measuring process's own event loop.
 */

/**
 * The whole configuration surface. Edit here, redeploy; no env vars required.
 */
const CONFIG = {
  /** Off under jest so the unit suite stays clean; on everywhere else this branch runs. */
  enabled: process.env.PERF_TRACE_ENABLED ? process.env.PERF_TRACE_ENABLED === 'true' : process.env.NODE_ENV !== 'test',
  /** Child spans faster than this are suppressed. The ┌/└ envelope ignores it. */
  thresholdMs: 1,
  /** URL substrings to trace. Scoped to the assignment endpoint for this investigation. */
  tracedPaths: ['/v6/assign'],
  /** Applied after tracedPaths, so an exclusion always wins. */
  excludedPaths: [] as string[],
};

interface PerfTraceContext {
  requestId: string;
}

const storage = new AsyncLocalStorage<PerfTraceContext>();

function envList(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (raw === undefined) {
    return fallback;
  }
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function envNumber(name: string, fallback: number): number {
  const parsed = parseInt(process.env[name] ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const enabled = CONFIG.enabled;
const thresholdMs = envNumber('PERF_TRACE_THRESHOLD_MS', CONFIG.thresholdMs);
const tracedPaths = envList('PERF_TRACE_PATHS', CONFIG.tracedPaths);
const excludedPaths = envList('PERF_TRACE_EXCLUDE_PATHS', CONFIG.excludedPaths);

/**
 * A logger of this harness's own rather than the app's, for two reasons: it is unaffected by
 * LOG_LEVEL (so app logs can be turned all the way down without silencing the traces), and it can
 * batch its Splunk writes. The app's transport takes splunk-logging's defaults — maxBatchCount 1,
 * batchInterval 0 — which is one HTTPS POST per line. At load-test rates that outbound I/O would
 * perturb the very latency being measured.
 *
 * Built lazily so that merely importing this module starts no timer and opens no socket; nothing is
 * constructed when tracing is disabled, which is what keeps the jest suite clean.
 */
let perfLogger: Logger | undefined;

function getPerfLogger(): Logger {
  if (perfLogger) {
    return perfLogger;
  }

  const perfTransports: TransportStream[] = [
    // printf so stdout carries the bare rendered line, exactly as the reference emits it.
    new transports.Console({ format: format.printf((info) => String(info.message)) }),
  ];

  const { SPLUNK_HOST, SPLUNK_TOKEN, SPLUNK_INDEX } = process.env;
  if (SPLUNK_HOST && SPLUNK_TOKEN && SPLUNK_INDEX) {
    perfTransports.push(
      new SplunkStreamEvent({
        splunk: {
          host: SPLUNK_HOST,
          token: SPLUNK_TOKEN,
          index: SPLUNK_INDEX,
          // maxBatchCount 0 disables the flush-per-event default; the interval flushes instead.
          // Trade-off: up to one second of trace events is lost if the task dies mid-run.
          maxBatchCount: 0,
          maxBatchSize: 512 * 1024,
          batchInterval: 1000,
          eventFormatter: (message: { meta?: Record<string, unknown> }) => ({ ...message.meta }),
        },
        format: format.json(),
      }) as unknown as TransportStream
    );
  }

  perfLogger = createLogger({ level: 'info', transports: perfTransports });
  return perfLogger;
}

/** One emit point, so the rendered line and the structured fields can never drift apart. */
function emit(line: string, fields: Record<string, unknown>): void {
  getPerfLogger().info({ message: line, perfTrace: true, ...fields });
}

// Monotonic counter rather than a uuid — ids only need to be unique within one process lifetime,
// and this keeps the hot path free of allocation-heavy id generation.
let requestCounter = 0;
let inFlight = 0;

const RULE = '─'.repeat(5);

function shouldTrace(path: string): boolean {
  if (!enabled) {
    return false;
  }
  // Exclusions win, so a broad include list can be narrowed without rewriting it.
  if (excludedPaths.some((excluded) => path.includes(excluded))) {
    return false;
  }
  // No configured paths means trace everything.
  return tracedPaths.length === 0 || tracedPaths.some((tracedPath) => path.includes(tracedPath));
}

function logSpan(label: string, start: number, end: number, requestId: string): void {
  const duration = end - start;
  if (duration < thresholdMs) {
    return;
  }
  emit(
    `[perf] │ req=${requestId} inflight=${inFlight} dur=${duration.toFixed(3)}ms ` +
      `start=${start.toFixed(3)} end=${end.toFixed(3)} span=${label}`,
    { kind: 'span', req: requestId, inflight: inFlight, durMs: +duration.toFixed(3), span: label }
  );
}

/**
 * Spans only log inside a traced request.
 *
 * Shared code — global middleware especially — runs on endpoints the path filter has excluded.
 * Without this gate those spans would still print, unattributed, and narrowing PERF_TRACE_PATHS to
 * one endpoint would not actually isolate its output. Gating on the presence of an
 * AsyncLocalStorage context makes the path filter authoritative for everything beneath it.
 */
function ambientRequestId(): string | undefined {
  return storage.getStore()?.requestId;
}

/**
 * Outermost span. Register on the express app *before* the routing layer wires up its routes, so
 * the envelope encloses everything the framework does on the request's behalf: CORS, body parsing,
 * validation, per-route middleware, the handler, and response serialization.
 *
 * That placement is the whole point — an in-handler span misses the middleware work and the
 * response serialization, which is exactly the gap between what the trace reports and what an
 * external client (JMeter, curl) measures.
 *
 * Also establishes the request id that every nested tracePerf* call picks up via AsyncLocalStorage,
 * so no request context has to be threaded through method signatures.
 */
export function perfTraceMiddleware(req: Request, res: Response, next: NextFunction): void {
  const path = req.originalUrl || req.url;
  if (!shouldTrace(path)) {
    next();
    return;
  }

  const requestId = (++requestCounter).toString(36).padStart(4, '0');
  const label = `${req.method} ${path}`;
  const start = performance.now();
  inFlight++;

  emit(`[perf] ┌${RULE} req=${requestId} inflight=${inFlight} start=${start.toFixed(3)} ${label}`, {
    kind: 'open',
    req: requestId,
    inflight: inFlight,
    method: req.method,
    path,
  });

  let settled = false;
  const close = () => {
    if (settled) {
      return;
    }
    settled = true;
    const end = performance.now();
    // Log before decrementing so `inflight` includes this request in its own line.
    emit(
      `[perf] └${RULE} req=${requestId} inflight=${inFlight} dur=${(end - start).toFixed(3)}ms ` +
        `start=${start.toFixed(3)} end=${end.toFixed(3)} ${label}`,
      {
        kind: 'close',
        req: requestId,
        inflight: inFlight,
        durMs: +(end - start).toFixed(3),
        method: req.method,
        path,
        status: res.statusCode,
      }
    );
    inFlight--;
  };

  // 'finish' fires once the response is flushed to the socket, so the envelope covers serialization
  // and the write. 'close' is the fallback for client aborts, so inFlight cannot leak.
  res.on('finish', close);
  res.on('close', close);

  storage.run({ requestId }, () => next());
}

/** Times an awaited span against the ambient request id. No-op outside a traced request. */
export async function tracePerfAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const requestId = enabled ? ambientRequestId() : undefined;
  if (!requestId) {
    return fn();
  }

  const start = performance.now();
  try {
    return await fn();
  } finally {
    logSpan(label, start, performance.now(), requestId);
  }
}

/** Times a synchronous span against the ambient request id. No-op outside a traced request. */
export function tracePerfSync<T>(label: string, fn: () => T): T {
  const requestId = enabled ? ambientRequestId() : undefined;
  if (!requestId) {
    return fn();
  }

  const start = performance.now();
  try {
    return fn();
  } finally {
    logSpan(label, start, performance.now(), requestId);
  }
}
