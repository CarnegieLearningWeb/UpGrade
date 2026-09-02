import { env } from '../env';

/**
 * Thin wrapper over the New Relic agent's custom-attribute API.
 *
 * The agent itself is started in `src/app.ts` when USE_NEW_RELIC is set. We resolve it here
 * once at module load — not per request — so the hot path costs a null check and a property
 * access. `require('newrelic')` and `require('newrelic/index')` resolve to the same file, so
 * this shares the require cache with app.ts rather than initializing a second agent.
 *
 * When USE_NEW_RELIC is false the agent is never loaded and every call below is a no-op.
 */
interface NewRelicAgent {
  addCustomAttribute(key: string, value: string | number | boolean): void;
}

let agent: NewRelicAgent | null = null;

if (env.useNewRelic) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    agent = require('newrelic') as NewRelicAgent;
  } catch {
    agent = null;
  }
}

/**
 * Attach a custom attribute to the current New Relic transaction, making it available as a
 * FACET in NRQL. Synchronous and in-process — no I/O, nothing added to request latency.
 * Never throws: telemetry must not be able to fail a request.
 */
export function addCustomAttribute(key: string, value: string | number | boolean): void {
  if (!agent) {
    return;
  }
  try {
    agent.addCustomAttribute(key, value);
  } catch {
    // no-op — e.g. called outside an active transaction
  }
}

// New Relic silently truncates custom attribute values at 255 chars, so cap here too —
// otherwise the same request shows a truncated value in NR but the untruncated one in logs.
const MAX_CUSTOM_ATTRIBUTE_LENGTH = 255;

// Strip control/non-printable characters: values reported here often come straight off
// request headers on public endpoints, and neither NR nor our log fields sanitize them.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;

/**
 * Normalize a raw string (e.g. a request header) before it's used as both a log field and an
 * NR custom attribute value: strips control characters, trims, caps length to match NR's own
 * truncation limit, and falls back to `fallback` when nothing meaningful is left.
 */
export function sanitizeCustomAttributeValue(value: string | undefined, fallback = 'unknown'): string {
  const cleaned = (value ?? '').replace(CONTROL_CHARS, '').trim();
  return cleaned ? cleaned.slice(0, MAX_CUSTOM_ATTRIBUTE_LENGTH) : fallback;
}
