import { randomBytes } from 'crypto';

/**
 * An opaque id for this server process, fixed for the life of the process.
 *
 * Deliberately says nothing about the host, the process, or how the deployment is configured — it
 * only answers "which instance replied". Behind a load balancer every task answers on the same
 * address, so this is the only way to tell two responses apart, or to notice that a task was
 * replaced: a changed id means a new process, and therefore a cache that started empty.
 *
 * Random rather than derived, so that it cannot be worked backwards into anything about the host.
 */
const INSTANCE_ID = randomBytes(4).toString('hex');

export function getInstanceId(): string {
  return INSTANCE_ID;
}
