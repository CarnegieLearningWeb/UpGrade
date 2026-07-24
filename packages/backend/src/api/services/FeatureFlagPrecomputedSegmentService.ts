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
import { PrecomputedSegmentServiceBase } from './PrecomputedSegmentServiceBase';

// Re-exported for the read path (FeatureFlagService) and any other consumers that historically
// imported these from this module. The definitions now live in the shared helpers module so the
// feature-flag write path and read path use the exact same key composition.
export { PRECOMPUTED_GROUP_DELIMITER, precomputedGroupKey } from './precomputedSegmentHelpers';

@Service()
export class FeatureFlagPrecomputedSegmentService extends PrecomputedSegmentServiceBase<FeatureFlagPrecomputedSegment> {
  protected readonly cachePrefix = CACHE_PREFIX.FEATURE_FLAG_PRECOMPUTED_SEGMENT_KEY_PREFIX;
  protected readonly tableLabel = 'feature_flag_precomputed_segment';
  protected readonly ownerLabel = 'flag';

  constructor(
    @InjectRepository() private precomputedSegmentRepository: FeatureFlagPrecomputedSegmentRepository,
    @InjectRepository() private featureFlagSegmentInclusionRepository: FeatureFlagSegmentInclusionRepository,
    @InjectRepository() private featureFlagSegmentExclusionRepository: FeatureFlagSegmentExclusionRepository,
    @InjectRepository() private featureFlagRepository: FeatureFlagRepository,
    @InjectRepository() segmentRepository: SegmentRepository,
    cacheService: CacheService
  ) {
    super(segmentRepository, cacheService);
  }

  // --- domain seams ---

  protected async getListsForOwner(
    flagId: string
  ): Promise<{ inclusionSegmentIds: string[]; exclusionSegmentIds: string[] }> {
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

    return {
      inclusionSegmentIds: inclusionRecords.map((r) => r.segment.id),
      exclusionSegmentIds: exclusionRecords.map((r) => r.segment.id),
    };
  }

  protected async findOwnerIdsBySegmentId(segmentId: string): Promise<string[]> {
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

    return [
      ...new Set([...inclusionRecords.map((r) => r.featureFlag.id), ...exclusionRecords.map((r) => r.featureFlag.id)]),
    ];
  }

  protected upsertOwner(flagId: string, inclusionIds: string[], exclusionIds: string[]): Promise<void> {
    return this.precomputedSegmentRepository.upsertByFlagId(flagId, inclusionIds, exclusionIds);
  }

  protected findRowsByOwnerIds(flagIds: string[]): Promise<(FeatureFlagPrecomputedSegment | null)[]> {
    return this.precomputedSegmentRepository.findByFlagIds(flagIds);
  }

  protected async findAllOwnerIds(): Promise<string[]> {
    const flags = await this.featureFlagRepository.find({ select: ['id'] });
    return flags.map((f) => f.id);
  }

  protected async findExistingOwnerIds(): Promise<string[]> {
    const rows = await this.precomputedSegmentRepository.find({ select: ['featureFlagId'] });
    return rows.map((r) => r.featureFlagId);
  }

  // --- domain-named public API (thin wrappers over the shared base) ---

  public recomputeForFlag(flagId: string, logger: UpgradeLogger): Promise<void> {
    return this.recomputeOwner(flagId, logger);
  }

  public scheduleRecomputeForFlags(flagIds: string[], logger: UpgradeLogger): void {
    this.scheduleRecomputeForOwners(flagIds, logger);
  }

  public getAffectedFlagIds(segmentId: string): Promise<string[]> {
    return this.getAffectedOwnerIds(segmentId);
  }

  public recomputeAllFlags(logger: UpgradeLogger): Promise<void> {
    return this.recomputeAllOwners(logger);
  }

  public backfillMissingFlags(logger: UpgradeLogger): Promise<void> {
    return this.backfillMissingOwners(logger);
  }

  // Seed an empty feature_flag_precomputed_segment row for a brand-new flag, inside the flag's own
  // creation transaction so the row is atomic with the flag insert. A new flag has no segment lists,
  // so empty arrays are the correct initial state. `orIgnore` keeps this a no-op if a row somehow
  // already exists. Seeding here guarantees getPrecomputedSets never returns a missing row for a
  // freshly created flag (keeps the read-path cache effective). This is entity-specific, so it stays
  // on the subclass rather than the shared base.
  public async seedEmptyRowForFlag(flagId: string, manager: EntityManager): Promise<void> {
    await manager
      .createQueryBuilder()
      .insert()
      .into(FeatureFlagPrecomputedSegment)
      .values({ featureFlagId: flagId, inclusionIds: [], exclusionIds: [] })
      .orIgnore()
      .execute();
  }
}
