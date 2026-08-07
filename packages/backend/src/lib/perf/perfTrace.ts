import { AsyncLocalStorage } from 'async_hooks';
import { performance } from 'perf_hooks';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../../env';

/**
 * Lightweight request-correlated performance tracing for hot-path investigation.
 *
 * Every span logs the id of the request it belongs to, how many traced requests were in flight when
 * it closed, and its start/end marks on the shared `performance.now()` monotonic clock. Because all
 * spans in a process share that one clock, the marks from concurrent requests are directly
 * comparable — which is what makes the output diagnostic rather than merely descriptive:
 *
 *   - A stop-the-world stall (major GC, a long synchronous block) delays every request that is
 *     awaiting at that instant. You see several requests with overlapping windows all report an
 *     inflated duration and all land on nearly the same `end` mark.
 *   - Connection-pool queueing delays only the request that had to wait for a connection. You see
 *     one inflated duration while `inflight` shows several peers that finished normally.
 *
 * Output is bracketed so request boundaries are findable in a busy log:
 *
 *   [perf] ┌───── req=005w inflight=2 start=243915.094 POST /api/v6/assign
 *   [perf] │ req=005w inflight=2 dur=1.204ms start=… end=… span=UserCheckMiddleware.getUserDoc
 *   [perf] └───── req=005w inflight=2 dur=21.412ms start=… end=… POST /api/v6/assign
 *
 * The ┌ / └ envelope is emitted for every traced request. The threshold applies only to the child
 * spans in between, so a fast request collapses to just its two envelope lines.
 *
 * Controlled by three env vars:
 *   PERF_TRACE_ENABLED      off unless 'true'
 *   PERF_TRACE_THRESHOLD_MS child spans below this are suppressed; 0 logs all of them
 *   PERF_TRACE_PATHS        comma-separated URL substrings to trace; empty traces every request
 *
 * Keeping the threshold above zero matters under load: `console.log` to a TTY is a synchronous
 * write, so tracing every span perturbs the very event-loop latency you are trying to measure.
 */

interface PerfTraceContext {
  requestId: string;
}

const storage = new AsyncLocalStorage<PerfTraceContext>();

// Monotonic counter rather than a uuid — ids only need to be unique within one process lifetime,
// and this keeps the hot path free of allocation-heavy id generation.
let requestCounter = 0;
let inFlight = 0;

const enabled = env.perfTrace.enabled;
const thresholdMs = env.perfTrace.thresholdMs;
const tracedPaths = env.perfTrace.paths;

const RULE = '─'.repeat(5);

function shouldTrace(path: string): boolean {
  if (!enabled) {
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

function currentRequestId(): string {
  return storage.getStore()?.requestId ?? '-';
}

/**
 * Outermost span. Register this on the express app *before* routing-controllers wires up its own
 * routes, so the envelope encloses everything the framework does on the request's behalf: CORS, body
 * parsing, class-validator, the @UseBefore middlewares, the handler, and response serialization.
 *
 * That placement is the whole point — an in-handler span misses the middleware DB lookups and the
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

/** Times an awaited span against the ambient request id. */
export async function tracePerfAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!enabled) {
    return fn();
  }

  const requestId = currentRequestId();
  const start = performance.now();
  try {
    return await fn();
  } finally {
    logSpan(label, start, performance.now(), requestId);
  }
}

/** Times a synchronous span against the ambient request id. */
export function tracePerfSync<T>(label: string, fn: () => T): T {
  if (!enabled) {
    return fn();
  }

  const requestId = currentRequestId();
  const start = performance.now();
  try {
    return fn();
  } finally {
    logSpan(label, start, performance.now(), requestId);
  }
}
