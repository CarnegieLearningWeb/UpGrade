import { Repository, EntityManager } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { FeatureFlag } from '../models/FeatureFlag';
import repositoryError from './utils/repositoryError';
import { FEATURE_FLAG_STATUS, FILTER_MODE } from 'upgrade_types';

@EntityRepository(FeatureFlag)
export class FeatureFlagRepository extends Repository<FeatureFlag> {
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
    const result = await this.createQueryBuilder('feature_flag')
      .leftJoinAndSelect('feature_flag.featureFlagSegmentInclusion', 'featureFlagSegmentInclusion')
      .leftJoinAndSelect('featureFlagSegmentInclusion.segment', 'segmentInclusion')
      .leftJoinAndSelect('segmentInclusion.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segmentInclusion.groupForSegment', 'groupForSegment')
      .leftJoinAndSelect('segmentInclusion.subSegments', 'subSegment')
      .leftJoinAndSelect('feature_flag.featureFlagSegmentExclusion', 'featureFlagSegmentExclusion')
      .leftJoinAndSelect('featureFlagSegmentExclusion.segment', 'segmentExclusion')
      .leftJoinAndSelect('segmentExclusion.individualForSegment', 'individualForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.groupForSegment', 'groupForSegmentExclusion')
      .leftJoinAndSelect('segmentExclusion.subSegments', 'subSegmentExclusion')
      .where('feature_flag.context @> :searchContext', { searchContext: [context] })
      .andWhere('feature_flag.status = :status', { status: FEATURE_FLAG_STATUS.ENABLED })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FeatureFlagRepository', 'getFlagsFromContext', { context }, errorMsg);
        throw errorMsgString;
      });

    return result;
  }
}
