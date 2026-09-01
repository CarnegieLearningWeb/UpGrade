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
