import { Repository, EntityManager, SelectQueryBuilder } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { FeatureFlag } from '../models/FeatureFlag';
import repositoryError from './utils/repositoryError';
import { FEATURE_FLAG_STATUS, FILTER_MODE } from 'upgrade_types';
import { FeatureFlagValidation } from '../controllers/validators/FeatureFlagValidator';
import { IndividualForSegment } from '../models/IndividualForSegment';
import { GroupForSegment } from '../models/GroupForSegment';

@EntityRepository(FeatureFlag)
export class FeatureFlagRepository extends Repository<FeatureFlag> {
  public async findOneForDetails(id: string, entityManager?: EntityManager): Promise<FeatureFlag | undefined> {
    const repository = entityManager ? entityManager.getRepository(FeatureFlag) : this;
    const manager = entityManager || this.manager;
    const featureFlag = await repository
      .createQueryBuilder('feature_flag')
      .leftJoinAndSelect('feature_flag.featureFlagSegmentInclusion', 'featureFlagSegmentInclusion')
      .leftJoinAndSelect('featureFlagSegmentInclusion.segment', 'segmentInclusion')
      .leftJoinAndSelect('segmentInclusion.subSegments', 'subSegment')
      .leftJoinAndSelect('feature_flag.featureFlagSegmentExclusion', 'featureFlagSegmentExclusion')
      .leftJoinAndSelect('featureFlagSegmentExclusion.segment', 'segmentExclusion')
      .leftJoinAndSelect('segmentExclusion.subSegments', 'subSegmentExclusion')
      .where({ id })
      .getOne();

    if (!featureFlag) {
      return undefined;
    }

    // loadRelationCountAndMap was removed in TypeORM 1.0; fetch member counts with two batch queries.
    const segments = [
      ...(featureFlag.featureFlagSegmentInclusion ?? []).map((r) => r.segment),
      ...(featureFlag.featureFlagSegmentExclusion ?? []).map((r) => r.segment),
    ].filter(Boolean);

    if (segments.length > 0) {
      const segmentIds = segments.map((s) => s.id);

      const [individualCounts, groupCounts] = await Promise.all([
        manager
          .createQueryBuilder()
          .select('ifs.segmentId', 'segmentId')
          .addSelect('COUNT(*)', 'count')
          .from(IndividualForSegment, 'ifs')
          .where('ifs.segmentId IN (:...segmentIds)', { segmentIds })
          .groupBy('ifs.segmentId')
          .getRawMany<{ segmentId: string; count: string }>(),
        manager
          .createQueryBuilder()
          .select('gfs.segmentId', 'segmentId')
          .addSelect('COUNT(*)', 'count')
          .from(GroupForSegment, 'gfs')
          .where('gfs.segmentId IN (:...segmentIds)', { segmentIds })
          .groupBy('gfs.segmentId')
          .getRawMany<{ segmentId: string; count: string }>(),
      ]);

      const individualCountMap = new Map(individualCounts.map((r) => [r.segmentId, Number.parseInt(r.count, 10)]));
      const groupCountMap = new Map(groupCounts.map((r) => [r.segmentId, Number.parseInt(r.count, 10)]));

      segments.forEach((segment) => {
        segment.individualForSegmentCount = individualCountMap.get(segment.id) ?? 0;
        segment.groupForSegmentCount = groupCountMap.get(segment.id) ?? 0;
      });
    }

    return featureFlag;
  }

  public async insertFeatureFlag(flagDoc: FeatureFlag, entityManager: EntityManager): Promise<FeatureFlag> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(FeatureFlag)
      .values(flagDoc)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FeatureFlagRepository', 'insertFeatureFlag', { flagDoc }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteById(id: string, entityManager: EntityManager): Promise<FeatureFlag> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(FeatureFlag)
      .where('id = :id', { id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FeatureFlagRepository', 'deleteById', { id }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async updateState(flagId: string, status: FEATURE_FLAG_STATUS): Promise<FeatureFlag> {
    const result = await this.createQueryBuilder('featureFlag')
      .update()
      .set({ status })
      .where({ id: flagId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FeatureFlagRepository', 'updateState', { flagId, status }, errorMsg);
        throw errorMsgString;
      });

    return result.raw[0];
  }

  public async updateFilterMode(flagId: string, filterMode: FILTER_MODE): Promise<FeatureFlag> {
    const result = await this.createQueryBuilder('featureFlag')
      .update()
      .set({ filterMode })
      .where({ id: flagId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'FeatureFlagRepository',
          'updateFilterMode',
          { flagId, filterMode },
          errorMsg
        );
        throw errorMsgString;
      });

    return result.raw[0];
  }

  public async updateFeatureFlag(flagDoc: Partial<FeatureFlag>, entityManager: EntityManager): Promise<FeatureFlag> {
    const result = await entityManager
      .createQueryBuilder()
      .update(FeatureFlag)
      .set(flagDoc)
      .where({ id: flagDoc.id })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FeatureFlagRepository', 'updateFeatureFlag', { flagDoc }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async getFlagsFromContext(context: string): Promise<FeatureFlag[]> {
    const addExclusionJoins = (qb: SelectQueryBuilder<FeatureFlag>) =>
      qb
        .leftJoinAndSelect('feature_flag.featureFlagSegmentExclusion', 'featureFlagSegmentExclusion')
        .leftJoinAndSelect('featureFlagSegmentExclusion.segment', 'segmentExclusion')
        .leftJoinAndSelect('segmentExclusion.individualForSegment', 'individualForSegmentExclusion')
        .leftJoinAndSelect('segmentExclusion.groupForSegment', 'groupForSegmentExclusion')
        .leftJoinAndSelect('segmentExclusion.subSegments', 'subSegmentExclusion');

    const addInclusionJoins = (qb: SelectQueryBuilder<FeatureFlag>) =>
      qb
        .leftJoinAndSelect('feature_flag.featureFlagSegmentInclusion', 'featureFlagSegmentInclusion')
        .leftJoinAndSelect('featureFlagSegmentInclusion.segment', 'segmentInclusion')
        .leftJoinAndSelect('segmentInclusion.individualForSegment', 'individualForSegment')
        .leftJoinAndSelect('segmentInclusion.groupForSegment', 'groupForSegment')
        .leftJoinAndSelect('segmentInclusion.subSegments', 'subSegment');

    const addBaseConditions = (qb: SelectQueryBuilder<FeatureFlag>) =>
      qb
        .where('feature_flag.context @> :searchContext', { searchContext: [context] })
        .andWhere('feature_flag.status = :status', { status: FEATURE_FLAG_STATUS.ENABLED });

    // INCLUDE_ALL flags: inclusion segments are irrelevant — skip all inclusion joins
    const includeAllQuery = addBaseConditions(addExclusionJoins(this.createQueryBuilder('feature_flag'))).andWhere(
      'feature_flag.filterMode = :includeAll',
      { includeAll: FILTER_MODE.INCLUDE_ALL }
    );

    // EXCLUDE_ALL flags: both inclusion and exclusion segments are needed
    const excludeAllQuery = addBaseConditions(
      addInclusionJoins(addExclusionJoins(this.createQueryBuilder('feature_flag')))
    ).andWhere('feature_flag.filterMode = :excludeAll', { excludeAll: FILTER_MODE.EXCLUDE_ALL });

    const [includeAllFlags, excludeAllFlags] = await Promise.all([
      includeAllQuery.getMany().catch((errorMsg: any) => {
        throw repositoryError('FeatureFlagRepository', 'getFlagsFromContext', { context }, errorMsg);
      }),
      excludeAllQuery.getMany().catch((errorMsg: any) => {
        throw repositoryError('FeatureFlagRepository', 'getFlagsFromContext', { context }, errorMsg);
      }),
    ]);

    return [...includeAllFlags, ...excludeAllFlags];
  }

  // Minimal projection for getKeys — only id, key, filterMode needed; no segment joins
  public async getFlagsForKeys(context: string): Promise<Pick<FeatureFlag, 'id' | 'key' | 'filterMode'>[]> {
    const result = await this.createQueryBuilder('feature_flag')
      .select(['feature_flag.id', 'feature_flag.key', 'feature_flag.filterMode'])
      .where('feature_flag.context @> :searchContext', { searchContext: [context] })
      .andWhere('feature_flag.status = :status', { status: FEATURE_FLAG_STATUS.ENABLED })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FeatureFlagRepository', 'getFlagsForKeys', { context }, errorMsg);
        throw errorMsgString;
      });

    return result;
  }

  public async validateUniqueKey(flagDTO: FeatureFlagValidation) {
    const queryBuilder = this.createQueryBuilder('feature_flag')
      .where('feature_flag.key = :key', { key: flagDTO.key })
      .andWhere('feature_flag.context = :context', { context: flagDTO.context });

    if (flagDTO.id) {
      queryBuilder.andWhere('feature_flag.id != :id', { id: flagDTO.id });
    }

    const result = await queryBuilder.getOne();
    return result;
  }
}
