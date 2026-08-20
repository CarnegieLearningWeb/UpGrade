import { AsyncLocalStorage } from 'async_hooks';
import { performance } from 'perf_hooks';
import type { NextFunction, Request, Response } from 'express';
// Imported for its side effect only: env.ts runs dotenv.config(), which must happen before the
// process.env reads below. Config is read straight from process.env rather than through the typed
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
 * The ┌/└ envelope is emitted for every traced request. The threshold applies only to the child
 * spans in between, so a fast request collapses to just its two envelope lines.
 *
 * Env vars:
 *   PERF_TRACE_ENABLED        off unless 'true'
 *   PERF_TRACE_THRESHOLD_MS   child spans below this are suppressed; 0 logs all of them
 *   PERF_TRACE_PATHS          comma-separated URL substrings to trace; empty traces every request
 *   PERF_TRACE_EXCLUDE_PATHS  comma-separated URL substrings to skip; wins over PERF_TRACE_PATHS
 *
 * isolate one endpoint:      PERF_TRACE_PATHS=/v6/assign
 * watch everything:          leave both path vars empty
 * all but the noisy ones:    PERF_TRACE_EXCLUDE_PATHS=/v6/log,/v6/mark
 *
 * Keep the threshold above zero under load: console.log to a TTY is a synchronous write, so tracing
 * every span perturbs the very event-loop latency you are trying to measure.
 */

interface PerfTraceContext {
  requestId: string;
}

const storage = new AsyncLocalStorage<PerfTraceContext>();

function envFlag(name: string): boolean {
  return process.env[name] === 'true';
}

function envList(name: string): string[] {
  return (process.env[name] || '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function envNumber(name: string, fallback: number): number {
  const parsed = parseInt(process.env[name] ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const enabled = envFlag('PERF_TRACE_ENABLED');
const thresholdMs = envNumber('PERF_TRACE_THRESHOLD_MS', 5);
const tracedPaths = envList('PERF_TRACE_PATHS');
const excludedPaths = envList('PERF_TRACE_EXCLUDE_PATHS');

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
  console.log(
    `[perf] │ req=${requestId} inflight=${inFlight} dur=${duration.toFixed(3)}ms ` +
      `start=${start.toFixed(3)} end=${end.toFixed(3)} span=${label}`
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

  console.log(`[perf] ┌${RULE} req=${requestId} inflight=${inFlight} start=${start.toFixed(3)} ${label}`);

  let settled = false;
  const close = () => {
    if (settled) {
      return;
    }
    settled = true;
    const end = performance.now();
    // Log before decrementing so `inflight` includes this request in its own line.
    console.log(
      `[perf] └${RULE} req=${requestId} inflight=${inFlight} dur=${(end - start).toFixed(3)}ms ` +
        `start=${start.toFixed(3)} end=${end.toFixed(3)} ${label}`
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
