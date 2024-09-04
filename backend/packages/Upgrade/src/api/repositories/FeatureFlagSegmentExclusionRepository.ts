import { Repository, EntityManager } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { FeatureFlagSegmentExclusion } from '../models/FeatureFlagSegmentExclusion';

@EntityRepository(FeatureFlagSegmentExclusion)
export class FeatureFlagSegmentExclusionRepository extends Repository<FeatureFlagSegmentExclusion> {
  public async insertData(
    data: Partial<FeatureFlagSegmentExclusion>,
    logger: UpgradeLogger,
    entityManager: EntityManager
  ): Promise<FeatureFlagSegmentExclusion> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(FeatureFlagSegmentExclusion)
      .values(data)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'FeatureFlagSegmentExclusionRepository',
          'insertFeatureFlagSegmentExclusion',
          { data },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }

  public async getFeatureFlagSegmentExclusionData(): Promise<Partial<FeatureFlagSegmentExclusion>[]> {
    return this.createQueryBuilder('featureFlagSegmentExclusion')
      .leftJoin('featureFlagSegmentExclusion.featureFlag', 'featureFlag')
      .leftJoin('featureFlagSegmentExclusion.segment', 'segment')
      .leftJoinAndSelect('segment.subSegments', 'subSegments')
      .addSelect('featureFlag.name')
      .addSelect('featureFlag.state')
      .addSelect('featureFlag.context')
      .addSelect('segment.id')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FeatureFlagSegmentExclusion', 'getdata', {}, errorMsg);
        throw errorMsgString;
      });
  }

  public async deleteData(segmentId: string, logger: UpgradeLogger): Promise<FeatureFlagSegmentExclusion> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(FeatureFlagSegmentExclusion)
      .where('segmentId=:segmentId', { segmentId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'FeatureFlagSegmentExclusionRepository',
          'deleteFeatureFlagSegmentExclusion',
          { segmentId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}
