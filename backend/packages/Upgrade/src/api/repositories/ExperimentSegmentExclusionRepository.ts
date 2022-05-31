import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { ExperimentSegmentExclusion } from '../models/ExperimentSegmentExclusion';

@EntityRepository(ExperimentSegmentExclusion)
export class ExperimentSegmentExclusionRepository extends Repository<ExperimentSegmentExclusion> {
  public async insertData(
    data: Partial<ExperimentSegmentExclusion>,
    logger: UpgradeLogger,
    entityManager: EntityManager
  ): Promise<ExperimentSegmentExclusion> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(ExperimentSegmentExclusion)
      .values(data)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentSegmentExclusionRepository',
          'insertExperimentSegmentExclusion',
          { data },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async deleteData(
    segmentId: string,
    experimentId: string,
    logger: UpgradeLogger
  ): Promise<ExperimentSegmentExclusion> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(ExperimentSegmentExclusion)
      .where('segmentId=:segmentId AND experimentId=:experimentId', { segmentId, experimentId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentSegmentExclusionRepository',
          'deleteExperimentSegmentExclusion',
          { segmentId, experimentId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}