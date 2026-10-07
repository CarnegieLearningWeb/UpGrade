import { EntityManager } from 'typeorm';

/** Optional internal transaction boundary; ordinary deletion callers retain their existing behavior. */
export type DeletionTransaction = <T>(work: (manager: EntityManager) => Promise<T>) => Promise<T>;
