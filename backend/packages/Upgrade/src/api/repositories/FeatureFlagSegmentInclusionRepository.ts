import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { FeatureFlagSegmentInclusion } from '../models/FeatureFlagSegmentInclusion';

@EntityRepository(FeatureFlagSegmentInclusion)
export class FeatureFlagSegmentInclusionRepository extends Repository<FeatureFlagSegmentInclusion> {
  public async insertData(
    data: Partial<FeatureFlagSegmentInclusion>,
    logger: UpgradeLogger,
    entityManager: EntityManager
  ): Promise<FeatureFlagSegmentInclusion> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(FeatureFlagSegmentInclusion)
      .values(data)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'FeatureFlagSegmentInclusionRepository',
          'insertFeatureFlagSegmentInclusion',
          { data },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }

  public async getFeatureFlagSegmentInclusionData(): Promise<Partial<FeatureFlagSegmentInclusion>[]> {
    return this.createQueryBuilder('featureFlagSegmentInclusion')
      .leftJoin('featureFlagSegmentInclusion.featureFlag', 'featureFlag')
      .leftJoin('featureFlagSegmentInclusion.segment', 'segment')
      .leftJoinAndSelect('segment.subSegments', 'subSegments')
      .addSelect('featureFlag.name')
      .addSelect('featureFlag.state')
      .addSelect('featureFlag.context')
      .addSelect('segment.id')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('FeatureFlagSegmentInclusion', 'getdata', {}, errorMsg);
        throw errorMsgString;
      });
  }

  public async deleteData(
    segmentId: string,
    featureFlagId: string,
    logger: UpgradeLogger
  ): Promise<FeatureFlagSegmentInclusion> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(FeatureFlagSegmentInclusion)
      .where('segmentId=:segmentId AND featureFlagId=:featureFlagId', { segmentId, featureFlagId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'FeatureFlagSegmentInclusionRepository',
          'deleteFeatureFlagSegmentInclusion',
          { segmentId, featureFlagId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}
