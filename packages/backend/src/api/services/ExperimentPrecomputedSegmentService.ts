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
import { precomputedGroupKey } from './FeatureFlagPrecomputedSegmentService';

@Service()
export class ExperimentPrecomputedSegmentService {
  constructor(
    @InjectRepository() private precomputedSegmentRepository: ExperimentPrecomputedSegmentRepository,
    @InjectRepository() private experimentSegmentInclusionRepository: ExperimentSegmentInclusionRepository,
    @InjectRepository() private experimentSegmentExclusionRepository: ExperimentSegmentExclusionRepository,
    @InjectRepository() private experimentRepository: ExperimentRepository,
    @InjectRepository() private segmentRepository: SegmentRepository,
    private cacheService: CacheService
  ) {}

  public async recomputeForExperiment(experimentId: string, logger: UpgradeLogger): Promise<void> {
    const [inclusionRecords, exclusionRecords] = await Promise.all([
      this.experimentSegmentInclusionRepository.find({
        where: { experiment: { id: experimentId } },
        relations: ['segment'],
      }),
      this.experimentSegmentExclusionRepository.find({
        where: { experiment: { id: experimentId } },
        relations: ['segment'],
      }),
    ]);

    const inclusionSegmentIds = inclusionRecords.map((r) => r.segment.id);
    const exclusionSegmentIds = exclusionRecords.map((r) => r.segment.id);

    const [inclusionIds, exclusionIds] = await Promise.all([
      this.flattenSegmentMembers(inclusionSegmentIds, new Set()),
      this.flattenSegmentMembers(exclusionSegmentIds, new Set()),
    ]);

    await this.precomputedSegmentRepository.upsertByExperimentId(
      experimentId,
      [...new Set(inclusionIds)],
      [...new Set(exclusionIds)]
    );

    await this.cacheService.delCache(CACHE_PREFIX.EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX + experimentId);
    logger.info({ message: `Recomputed experiment_precomputed_segment for experiment ${experimentId}` });
  }

  // Seed an empty experiment_precomputed_segment row for a brand-new experiment, inside the
  // experiment's own creation transaction so the row is atomic with the experiment insert.
  // A new experiment has no segment lists, so empty arrays are the correct initial state.
  // `orIgnore` keeps this a no-op if a row somehow already exists.
  public async seedEmptyRowForExperiment(experimentId: string, manager: EntityManager): Promise<void> {
    await manager
      .createQueryBuilder()
      .insert()
      .into(ExperimentPrecomputedSegment)
      .values({ experimentId, inclusionIds: [], exclusionIds: [] })
      .orIgnore()
      .execute();
  }

  // Triggered on segment member or structure changes — finds all affected experiments and recomputes (fire-and-forget)
  public scheduleRecomputeForSegment(segmentId: string, logger: UpgradeLogger): void {
    this.collectAffectedExperimentIds(segmentId, new Set())
      .then((experimentIds) =>
        Promise.all([...experimentIds].map((experimentId) => this.recomputeForExperiment(experimentId, logger)))
      )
      .catch((err) =>
        logger.error({ message: `Error in ExperimentPrecomputedSegmentService.scheduleRecomputeForSegment: ${err}` })
      );
  }

  // Fire-and-forget recompute for a known set of experiments. Callers on the write path MUST NOT
  // await this: the recompute is a read-through cache refresh that can run after the response is
  // returned. Errors are swallowed (logged) so an unhandled rejection can never crash the process.
  public scheduleRecomputeForExperiments(experimentIds: string[], logger: UpgradeLogger): void {
    Promise.all(
      [...new Set(experimentIds)].map((experimentId) => this.recomputeForExperiment(experimentId, logger))
    ).catch((err) =>
      logger.error({ message: `Error in ExperimentPrecomputedSegmentService.scheduleRecomputeForExperiments: ${err}` })
    );
  }

  // Run a segment/experiment-list mutation and guarantee the affected experiments' precomputed rows
  // are refreshed afterward — without the caller ever awaiting (or having to remember) the recompute.
  //
  // Ordering contract:
  //   1. `resolveAffectedExperimentIds` runs BEFORE `work`. Required for deletes (once the join rows
  //      are gone we can no longer discover which experiments referenced the segment).
  //   2. `work` runs to completion. It MUST own and commit its own transaction.
  //   3. The recompute is fired fire-and-forget AFTER `work` resolves (post-commit).
  public async withRecompute<T>(
    logger: UpgradeLogger,
    resolveAffectedExperimentIds: () => string[] | Promise<string[]>,
    work: () => Promise<T>
  ): Promise<T> {
    const affectedExperimentIds = await resolveAffectedExperimentIds();
    const result = await work();
    this.scheduleRecomputeForExperiments(affectedExperimentIds, logger);
    return result;
  }

  public async getPrecomputedSets(experimentIds: string[]): Promise<Map<string, ExperimentPrecomputedSegment>> {
    if (!experimentIds.length) return new Map();

    const results = await this.cacheService.wrapFunction(
      CACHE_PREFIX.EXPERIMENT_PRECOMPUTED_SEGMENT_KEY_PREFIX,
      experimentIds,
      () => this.precomputedSegmentRepository.findByExperimentIds(experimentIds)
    );

    const map = new Map<string, ExperimentPrecomputedSegment>();
    experimentIds.forEach((id, i) => {
      if (results[i]) map.set(id, results[i] as ExperimentPrecomputedSegment);
    });
    return map;
  }

  public async getAffectedExperimentIds(segmentId: string): Promise<string[]> {
    return [...(await this.collectAffectedExperimentIds(segmentId, new Set()))];
  }

  // One-time backfill for all existing experiments — call at startup or after migration
  public async recomputeAllExperiments(logger: UpgradeLogger): Promise<void> {
    const experiments = await this.experimentRepository.find({ select: ['id'] });
    for (const experiment of experiments) {
      try {
        await this.recomputeForExperiment(experiment.id, logger);
      } catch (err) {
        logger.error({
          message: `Failed to recompute experiment_precomputed_segment for experiment ${experiment.id}: ${err}`,
        });
      }
    }
    logger.info({ message: `Backfill complete: recomputed ${experiments.length} experiments` });
  }

  // Backfill only experiments that have no experiment_precomputed_segment row yet — safe to run every startup
  public async backfillMissingExperiments(logger: UpgradeLogger): Promise<void> {
    const [allExperiments, existingRows] = await Promise.all([
      this.experimentRepository.find({ select: ['id'] }),
      this.precomputedSegmentRepository.find({ select: ['experimentId'] }),
    ]);

    const existingExperimentIds = new Set(existingRows.map((r) => r.experimentId));
    const missingExperiments = allExperiments.filter((e) => !existingExperimentIds.has(e.id));

    if (!missingExperiments.length) {
      logger.info({
        message: 'experiment_precomputed_segment backfill: all experiments already have rows, nothing to do',
      });
      return;
    }

    for (const experiment of missingExperiments) {
      try {
        await this.recomputeForExperiment(experiment.id, logger);
      } catch (err) {
        logger.error({
          message: `Failed to backfill experiment_precomputed_segment for experiment ${experiment.id}: ${err}`,
        });
      }
    }
    logger.info({
      message: `experiment_precomputed_segment backfill complete: computed ${missingExperiments.length} of ${allExperiments.length} experiments`,
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
      // Individuals are stored bare; groups are namespaced with their type (see precomputedGroupKey).
      segment.individualForSegment.forEach((ind) => ids.push(ind.userId));
      segment.groupForSegment.forEach((grp) => ids.push(precomputedGroupKey(grp.type, grp.groupId)));
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

  private async collectAffectedExperimentIds(segmentId: string, visited: Set<string>): Promise<Set<string>> {
    if (visited.has(segmentId)) return new Set();
    visited.add(segmentId);

    const [inclusionRecords, exclusionRecords] = await Promise.all([
      this.experimentSegmentInclusionRepository.find({
        where: { segment: { id: segmentId } },
        relations: ['experiment'],
      }),
      this.experimentSegmentExclusionRepository.find({
        where: { segment: { id: segmentId } },
        relations: ['experiment'],
      }),
    ]);

    const experimentIds = new Set([
      ...inclusionRecords.map((r) => r.experiment.id),
      ...exclusionRecords.map((r) => r.experiment.id),
    ]);

    const parentIds = await this.segmentRepository.findParentSegmentIds(segmentId);
    await Promise.all(
      parentIds.map(async (parentId) => {
        const parentExperimentIds = await this.collectAffectedExperimentIds(parentId, visited);
        parentExperimentIds.forEach((id) => experimentIds.add(id));
      })
    );

    return experimentIds;
  }
}
