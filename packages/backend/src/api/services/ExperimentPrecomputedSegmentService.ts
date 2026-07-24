import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { ExperimentPrecomputedSegmentRepository } from '../repositories/ExperimentPrecomputedSegmentRepository';
import { ExperimentSegmentInclusionRepository } from '../repositories/ExperimentSegmentInclusionRepository';
import { ExperimentSegmentExclusionRepository } from '../repositories/ExperimentSegmentExclusionRepository';
import { ExperimentRepository } from '../repositories/ExperimentRepository';
import { SegmentRepository } from '../repositories/SegmentRepository';
import { ExperimentPrecomputedSegment } from '../models/ExperimentPrecomputedSegment';
import { CacheService } from './CacheService';
import { CACHE_PREFIX } from 'upgrade_types';
import { UpgradeLogger } from '../../lib/logger/UpgradeLogger';
import { EntityManager } from 'typeorm';
import { PrecomputedSegmentServiceBase } from './PrecomputedSegmentServiceBase';

@Service()
export class ExperimentPrecomputedSegmentService extends PrecomputedSegmentServiceBase<ExperimentPrecomputedSegment> {
  protected readonly cachePrefix = CACHE_PREFIX.EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX;
  protected readonly tableLabel = 'experiment_precomputed_segment';
  protected readonly ownerLabel = 'experiment';

  constructor(
    @InjectRepository() private precomputedSegmentRepository: ExperimentPrecomputedSegmentRepository,
    @InjectRepository() private experimentSegmentInclusionRepository: ExperimentSegmentInclusionRepository,
    @InjectRepository() private experimentSegmentExclusionRepository: ExperimentSegmentExclusionRepository,
    @InjectRepository() private experimentRepository: ExperimentRepository,
    @InjectRepository() segmentRepository: SegmentRepository,
    cacheService: CacheService
  ) {
    super(segmentRepository, cacheService);
  }

  // --- domain seams ---

  // Unlike feature flags, experiment join tables have no `enabled` column — every row is active, so
  // there is no `enabled: true` filter here.
  protected async getListsForOwner(
    experimentId: string
  ): Promise<{ inclusionSegmentIds: string[]; exclusionSegmentIds: string[] }> {
    const [inclusionRecords, exclusionRecords] = await Promise.all([
      this.experimentSegmentInclusionRepository.find({
        where: { experiment: { id: experimentId } },
        relations: { segment: true },
      }),
      this.experimentSegmentExclusionRepository.find({
        where: { experiment: { id: experimentId } },
        relations: { segment: true },
      }),
    ]);

    return {
      inclusionSegmentIds: inclusionRecords.map((r) => r.segment.id),
      exclusionSegmentIds: exclusionRecords.map((r) => r.segment.id),
    };
  }

  protected async findOwnerIdsBySegmentId(segmentId: string): Promise<string[]> {
    const [inclusionRecords, exclusionRecords] = await Promise.all([
      this.experimentSegmentInclusionRepository.find({
        where: { segment: { id: segmentId } },
        relations: { experiment: true },
      }),
      this.experimentSegmentExclusionRepository.find({
        where: { segment: { id: segmentId } },
        relations: { experiment: true },
      }),
    ]);

    return [
      ...new Set([...inclusionRecords.map((r) => r.experiment.id), ...exclusionRecords.map((r) => r.experiment.id)]),
    ];
  }

  protected upsertOwner(experimentId: string, inclusionIds: string[], exclusionIds: string[]): Promise<void> {
    return this.precomputedSegmentRepository.upsertByExperimentId(experimentId, inclusionIds, exclusionIds);
  }

  protected findRowsByOwnerIds(experimentIds: string[]): Promise<(ExperimentPrecomputedSegment | null)[]> {
    return this.precomputedSegmentRepository.findByExperimentIds(experimentIds);
  }

  protected async findAllOwnerIds(): Promise<string[]> {
    const experiments = await this.experimentRepository.find({ select: { id: true } });
    return experiments.map((e) => e.id);
  }

  protected async findExistingOwnerIds(): Promise<string[]> {
    const rows = await this.precomputedSegmentRepository.find({ select: { experimentId: true } });
    return rows.map((r) => r.experimentId);
  }

  // --- domain-named public API (thin wrappers over the shared base) ---

  public recomputeForExperiment(experimentId: string, logger: UpgradeLogger): Promise<void> {
    return this.recomputeOwner(experimentId, logger);
  }

  public scheduleRecomputeForExperiments(experimentIds: string[], logger: UpgradeLogger): void {
    this.scheduleRecomputeForOwners(experimentIds, logger);
  }

  public getAffectedExperimentIds(segmentId: string): Promise<string[]> {
    return this.getAffectedOwnerIds(segmentId);
  }

  public recomputeAllExperiments(logger: UpgradeLogger): Promise<void> {
    return this.recomputeAllOwners(logger);
  }

  public backfillMissingExperiments(logger: UpgradeLogger): Promise<void> {
    return this.backfillMissingOwners(logger);
  }

  // Seed an empty experiment_precomputed_segment row for a brand-new experiment, inside the
  // experiment's own creation transaction so the row is atomic with the experiment insert. A new
  // experiment has no segment lists, so empty arrays are the correct initial state. `orIgnore` keeps
  // this a no-op if a row somehow already exists. Entity-specific, so it stays on the subclass.
  public async seedEmptyRowForExperiment(experimentId: string, manager: EntityManager): Promise<void> {
    await manager
      .createQueryBuilder()
      .insert()
      .into(ExperimentPrecomputedSegment)
      .values({ experimentId, inclusionIds: [], exclusionIds: [] })
      .orIgnore()
      .execute();
  }
}
