import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { FeatureFlagPrecomputedSegmentRepository } from '../repositories/FeatureFlagPrecomputedSegmentRepository';
import { FeatureFlagSegmentInclusionRepository } from '../repositories/FeatureFlagSegmentInclusionRepository';
import { FeatureFlagSegmentExclusionRepository } from '../repositories/FeatureFlagSegmentExclusionRepository';
import { FeatureFlagRepository } from '../repositories/FeatureFlagRepository';
import { SegmentRepository } from '../repositories/SegmentRepository';
import { FeatureFlagPrecomputedSegment } from '../models/FeatureFlagPrecomputedSegment';
import { CacheService } from './CacheService';
import { CACHE_PREFIX } from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { EntityManager } from 'typeorm';

@Service()
export class FeatureFlagPrecomputedSegmentService {
  constructor(
    @InjectRepository() private precomputedSegmentRepository: FeatureFlagPrecomputedSegmentRepository,
    @InjectRepository() private featureFlagSegmentInclusionRepository: FeatureFlagSegmentInclusionRepository,
    @InjectRepository() private featureFlagSegmentExclusionRepository: FeatureFlagSegmentExclusionRepository,
    @InjectRepository() private featureFlagRepository: FeatureFlagRepository,
    @InjectRepository() private segmentRepository: SegmentRepository,
    private cacheService: CacheService
  ) {}

  public async recomputeForFlag(flagId: string, logger: UpgradeLogger): Promise<void> {
    const [inclusionRecords, exclusionRecords] = await Promise.all([
      this.featureFlagSegmentInclusionRepository.find({
        where: { featureFlag: { id: flagId }, enabled: true },
        relations: ['segment'],
      }),
      this.featureFlagSegmentExclusionRepository.find({
        where: { featureFlag: { id: flagId }, enabled: true },
        relations: ['segment'],
      }),
    ]);

    const inclusionSegmentIds = inclusionRecords.map((r) => r.segment.id);
    const exclusionSegmentIds = exclusionRecords.map((r) => r.segment.id);

    const [inclusionIds, exclusionIds] = await Promise.all([
      this.flattenSegmentMembers(inclusionSegmentIds, new Set()),
      this.flattenSegmentMembers(exclusionSegmentIds, new Set()),
    ]);

    await this.precomputedSegmentRepository.upsertByFlagId(
      flagId,
      [...new Set(inclusionIds)],
      [...new Set(exclusionIds)]
    );

    await this.cacheService.delCache(CACHE_PREFIX.FEATURE_FLAG_PRECOMPUTED_SEGMENT_KEY_PREFIX + flagId);
    logger.info({ message: `Recomputed feature_flag_precomputed_segment for flag ${flagId}` });
  }

  // Seed an empty feature_flag_precomputed_segment row for a brand-new flag, inside the flag's own
  // creation transaction so the row is atomic with the flag insert. A new flag has no
  // segment lists, so empty arrays are the correct initial state. `orIgnore` keeps this a
  // no-op if a row somehow already exists. Seeding here guarantees getPrecomputedSets never
  // returns a missing row for a freshly created flag (keeps the read-path cache effective).
  public async seedEmptyRowForFlag(flagId: string, manager: EntityManager): Promise<void> {
    await manager
      .createQueryBuilder()
      .insert()
      .into(FeatureFlagPrecomputedSegment)
      .values({ featureFlagId: flagId, inclusionIds: [], exclusionIds: [] })
      .orIgnore()
      .execute();
  }

  // Triggered on segment member or structure changes — finds all affected flags and recomputes (fire-and-forget)
  public scheduleRecomputeForSegment(segmentId: string, logger: UpgradeLogger): void {
    this.collectAffectedFlagIds(segmentId, new Set())
      .then((flagIds) => Promise.all([...flagIds].map((flagId) => this.recomputeForFlag(flagId, logger))))
      .catch((err) => logger.error({ message: `Error in scheduleRecomputeForSegment: ${err}` }));
  }

  public async getPrecomputedSets(flagIds: string[]): Promise<Map<string, FeatureFlagPrecomputedSegment>> {
    if (!flagIds.length) return new Map();

    const results = await this.cacheService.wrapFunction(
      CACHE_PREFIX.FEATURE_FLAG_PRECOMPUTED_SEGMENT_KEY_PREFIX,
      flagIds,
      () => this.precomputedSegmentRepository.findByFlagIds(flagIds)
    );

    const map = new Map<string, FeatureFlagPrecomputedSegment>();
    flagIds.forEach((id, i) => {
      if (results[i]) map.set(id, results[i] as FeatureFlagPrecomputedSegment);
    });
    return map;
  }

  // One-time backfill for all existing flags — call at startup or after migration
  public async recomputeAllFlags(logger: UpgradeLogger): Promise<void> {
    const flags = await this.featureFlagRepository.find({ select: ['id'] });
    for (const flag of flags) {
      try {
        await this.recomputeForFlag(flag.id, logger);
      } catch (err) {
        logger.error({ message: `Failed to recompute feature_flag_precomputed_segment for flag ${flag.id}: ${err}` });
      }
    }
    logger.info({ message: `Backfill complete: recomputed ${flags.length} flags` });
  }

  // Backfill only flags that have no feature_flag_precomputed_segment row yet — safe to run every startup
  public async backfillMissingFlags(logger: UpgradeLogger): Promise<void> {
    const [allFlags, existingRows] = await Promise.all([
      this.featureFlagRepository.find({ select: ['id'] }),
      this.precomputedSegmentRepository.find({ select: ['featureFlagId'] }),
    ]);

    const existingFlagIds = new Set(existingRows.map((r) => r.featureFlagId));
    const missingFlags = allFlags.filter((f) => !existingFlagIds.has(f.id));

    if (!missingFlags.length) {
      logger.info({ message: 'feature_flag_precomputed_segment backfill: all flags already have rows, nothing to do' });
      return;
    }

    for (const flag of missingFlags) {
      try {
        await this.recomputeForFlag(flag.id, logger);
      } catch (err) {
        logger.error({ message: `Failed to backfill feature_flag_precomputed_segment for flag ${flag.id}: ${err}` });
      }
    }
    logger.info({
      message: `feature_flag_precomputed_segment backfill complete: computed ${missingFlags.length} of ${allFlags.length} flags`,
    });
  }

  private async flattenSegmentMembers(segmentIds: string[], seen: Set<string>): Promise<string[]> {
    const unresolved = segmentIds.filter((id) => !seen.has(id));
    if (!unresolved.length) return [];

    unresolved.forEach((id) => seen.add(id));

    const segments = await this.segmentRepository
      .createQueryBuilder('segment')
      .leftJoinAndSelect('segment.individualForSegment', 'individual')
      .leftJoinAndSelect('segment.groupForSegment', 'group')
      .leftJoinAndSelect('segment.subSegments', 'subSegment')
      .where('segment.id IN (:...ids)', { ids: unresolved })
      .getMany();

    const ids: string[] = [];
    const subSegmentIds: string[] = [];

    for (const segment of segments) {
      segment.individualForSegment.forEach((ind) => ids.push(ind.userId));
      segment.groupForSegment.forEach((grp) => ids.push(grp.groupId));
      segment.subSegments.forEach((sub) => {
        if (!seen.has(sub.id)) subSegmentIds.push(sub.id);
      });
    }

    if (subSegmentIds.length) {
      const subIds = await this.flattenSegmentMembers(subSegmentIds, seen);
      ids.push(...subIds);
    }

    return ids;
  }

  public async getAffectedFlagIds(segmentId: string): Promise<string[]> {
    return [...(await this.collectAffectedFlagIds(segmentId, new Set()))];
  }

  private async collectAffectedFlagIds(segmentId: string, visited: Set<string>): Promise<Set<string>> {
    if (visited.has(segmentId)) return new Set();
    visited.add(segmentId);

    const [inclusionRecords, exclusionRecords] = await Promise.all([
      this.featureFlagSegmentInclusionRepository.find({
        where: { segment: { id: segmentId } },
        relations: ['featureFlag'],
      }),
      this.featureFlagSegmentExclusionRepository.find({
        where: { segment: { id: segmentId } },
        relations: ['featureFlag'],
      }),
    ]);

    const flagIds = new Set([
      ...inclusionRecords.map((r) => r.featureFlag.id),
      ...exclusionRecords.map((r) => r.featureFlag.id),
    ]);

    const parentIds = await this.segmentRepository.findParentSegmentIds(segmentId);
    await Promise.all(
      parentIds.map(async (parentId) => {
        const parentFlagIds = await this.collectAffectedFlagIds(parentId, visited);
        parentFlagIds.forEach((id) => flagIds.add(id));
      })
    );

    return flagIds;
  }
}
