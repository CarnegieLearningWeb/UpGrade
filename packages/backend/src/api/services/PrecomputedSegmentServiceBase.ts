import { CacheService } from './CacheService';
import { SegmentRepository } from '../repositories/SegmentRepository';
import { CACHE_PREFIX } from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { flattenSegmentMembers } from './precomputedSegmentHelpers';

export interface PrecomputedSegmentRow {
  inclusionIds: string[];
  exclusionIds: string[];
}

/**
 * Domain-agnostic engine for precomputed segment inclusion/exclusion lists. Feature flags and
 * experiments each subclass this, supplying the domain-specific seams (which join tables, which
 * precomputed table, the cache prefix, and whether an `enabled` filter applies). All orchestration —
 * recompute + cache invalidation, the affected-owner ancestor walk, backfill, and the
 * resolve-before -> work -> recompute-after ordering contract (withRecompute) — lives here so the
 * two domains cannot drift.
 *
 * "Owner" = the entity that owns segment lists: a feature flag or an experiment. Subclasses expose
 * domain-named public wrappers (recomputeForFlag / recomputeForExperiment, ...) over these generic
 * methods so existing call sites read naturally.
 */
export abstract class PrecomputedSegmentServiceBase<TEntity extends PrecomputedSegmentRow> {
  constructor(protected segmentRepository: SegmentRepository, protected cacheService: CacheService) {}

  // --- seams supplied by the subclass ---

  /** cache key prefix, e.g. CACHE_PREFIX.FEATURE_FLAG_PRECOMPUTED_SEGMENT_KEY_PREFIX */
  protected abstract readonly cachePrefix: CACHE_PREFIX;
  /** table name used in log messages, e.g. 'feature_flag_precomputed_segment' */
  protected abstract readonly tableLabel: string;
  /** singular owner noun used in log messages, e.g. 'flag' or 'experiment' */
  protected abstract readonly ownerLabel: string;

  /**
   * Inclusion/exclusion segment IDs attached to one owner. The feature-flag subclass applies
   * `enabled: true` on the join rows; the experiment subclass does not (experiment join tables have
   * no `enabled` column).
   */
  protected abstract getListsForOwner(
    ownerId: string
  ): Promise<{ inclusionSegmentIds: string[]; exclusionSegmentIds: string[] }>;

  /** owner IDs that DIRECTLY reference a given segment via inclusion or exclusion */
  protected abstract findOwnerIdsBySegmentId(segmentId: string): Promise<string[]>;

  /** persist the flat arrays for one owner (subclass repo upsert) */
  protected abstract upsertOwner(ownerId: string, inclusionIds: string[], exclusionIds: string[]): Promise<void>;

  /** batch read, order-aligned to ownerIds, null for misses */
  protected abstract findRowsByOwnerIds(ownerIds: string[]): Promise<(TEntity | null)[]>;

  /** all owner IDs in the system */
  protected abstract findAllOwnerIds(): Promise<string[]>;
  /** owner IDs that already have a precomputed row */
  protected abstract findExistingOwnerIds(): Promise<string[]>;

  // --- concrete orchestration ---

  /**
   * Recompute one owner's flat arrays from its current segment lists and cache-invalidate it. This
   * is the only method that awaits the DB write; every fan-out routine below dispatches through it
   * (kept public so subclass wrappers and tests can target a single recompute entry point).
   */
  public async recomputeOwner(ownerId: string, logger: UpgradeLogger): Promise<void> {
    const { inclusionSegmentIds, exclusionSegmentIds } = await this.getListsForOwner(ownerId);

    const [inclusionIds, exclusionIds] = await Promise.all([
      flattenSegmentMembers(this.segmentRepository, inclusionSegmentIds, new Set()),
      flattenSegmentMembers(this.segmentRepository, exclusionSegmentIds, new Set()),
    ]);

    await this.upsertOwner(ownerId, [...new Set(inclusionIds)], [...new Set(exclusionIds)]);

    await this.cacheService.delCache(this.cachePrefix + ownerId);
    logger.info({ message: `Recomputed ${this.tableLabel} for ${this.ownerLabel} ${ownerId}` });
  }

  /** Fire-and-forget: find every owner referencing a segment (and its ancestors) and recompute each. */
  public scheduleRecomputeForSegment(segmentId: string, logger: UpgradeLogger): void {
    this.collectAffectedOwnerIds(segmentId, new Set())
      .then((ownerIds) => Promise.all([...ownerIds].map((id) => this.recomputeOwner(id, logger))))
      .catch((err) => logger.error({ message: `Error in scheduleRecomputeForSegment: ${err}` }));
  }

  /**
   * Fire-and-forget recompute for a known set of owners. Callers on the write path MUST NOT await
   * this: the recompute is a read-through cache refresh that can run after the response is returned.
   * Errors are swallowed (logged) so an unhandled rejection can never crash the process.
   */
  protected scheduleRecomputeForOwners(ownerIds: string[], logger: UpgradeLogger): void {
    Promise.all([...new Set(ownerIds)].map((id) => this.recomputeOwner(id, logger))).catch((err) =>
      logger.error({ message: `Error in scheduleRecomputeForOwners: ${err}` })
    );
  }

  /**
   * Run a segment/list mutation and guarantee the affected owners' precomputed rows are refreshed
   * afterward — without the caller ever awaiting the recompute. The ordering contract is enforced
   * here, once: (1) resolveAffectedOwnerIds runs BEFORE work (required for deletes — once the join
   * rows are gone the owners can no longer be discovered); (2) work runs to completion and MUST own
   * and commit its own transaction (the recompute reads through this service's repositories and
   * cannot see a still-open transaction's writes); (3) the recompute is fired fire-and-forget AFTER
   * work resolves (post-commit) and is not awaited.
   */
  public async withRecompute<T>(
    logger: UpgradeLogger,
    resolveAffectedOwnerIds: () => string[] | Promise<string[]>,
    work: () => Promise<T>
  ): Promise<T> {
    const affectedOwnerIds = await resolveAffectedOwnerIds();
    const result = await work();
    this.scheduleRecomputeForOwners(affectedOwnerIds, logger);
    return result;
  }

  /** Cache-wrapped batch read. Returns a Map keyed by owner ID (missing owners are absent). */
  public async getPrecomputedSets(ownerIds: string[]): Promise<Map<string, TEntity>> {
    if (!ownerIds.length) return new Map();

    const results = await this.cacheService.wrapFunction(this.cachePrefix, ownerIds, () =>
      this.findRowsByOwnerIds(ownerIds)
    );

    const map = new Map<string, TEntity>();
    ownerIds.forEach((id, i) => {
      if (results[i]) map.set(id, results[i] as TEntity);
    });
    return map;
  }

  /** Full refresh of every owner — not called automatically; available for manual recovery. */
  public async recomputeAllOwners(logger: UpgradeLogger): Promise<void> {
    const ownerIds = await this.findAllOwnerIds();
    for (const ownerId of ownerIds) {
      try {
        await this.recomputeOwner(ownerId, logger);
      } catch (err) {
        logger.error({ message: `Failed to recompute ${this.tableLabel} for ${this.ownerLabel} ${ownerId}: ${err}` });
      }
    }
    logger.info({ message: `Backfill complete: recomputed ${ownerIds.length} ${this.ownerLabel}s` });
  }

  /** Backfill only owners that have no precomputed row yet — safe to run every startup. */
  public async backfillMissingOwners(logger: UpgradeLogger): Promise<void> {
    const [allOwnerIds, existingOwnerIds] = await Promise.all([this.findAllOwnerIds(), this.findExistingOwnerIds()]);

    const existing = new Set(existingOwnerIds);
    const missing = allOwnerIds.filter((id) => !existing.has(id));

    if (!missing.length) {
      logger.info({
        message: `${this.tableLabel} backfill: all ${this.ownerLabel}s already have rows, nothing to do`,
      });
      return;
    }

    for (const ownerId of missing) {
      try {
        await this.recomputeOwner(ownerId, logger);
      } catch (err) {
        logger.error({ message: `Failed to backfill ${this.tableLabel} for ${this.ownerLabel} ${ownerId}: ${err}` });
      }
    }
    logger.info({
      message: `${this.tableLabel} backfill complete: computed ${missing.length} of ${allOwnerIds.length} ${this.ownerLabel}s`,
    });
  }

  /** Owner IDs affected by a change to a segment (the segment itself plus any ancestor references). */
  public async getAffectedOwnerIds(segmentId: string): Promise<string[]> {
    return [...(await this.collectAffectedOwnerIds(segmentId, new Set()))];
  }

  protected async collectAffectedOwnerIds(segmentId: string, visited: Set<string>): Promise<Set<string>> {
    if (visited.has(segmentId)) return new Set();
    visited.add(segmentId);

    const ownerIds = new Set(await this.findOwnerIdsBySegmentId(segmentId));

    const parentIds = await this.segmentRepository.findParentSegmentIds(segmentId);
    await Promise.all(
      parentIds.map(async (parentId) => {
        const parentOwnerIds = await this.collectAffectedOwnerIds(parentId, visited);
        parentOwnerIds.forEach((id) => ownerIds.add(id));
      })
    );

    return ownerIds;
  }
}
