import { Repository, EntityRepository } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { ExperimentSegmentInclusion } from '../models/ExperimentSegmentInclusion';

@EntityRepository(ExperimentSegmentInclusion)
export class ExperimentSegmentInclusionRepository extends Repository<ExperimentSegmentInclusion> {
  public async insertData(
    data: Partial<ExperimentSegmentInclusion>,
    logger: UpgradeLogger
  ): Promise<ExperimentSegmentInclusion> {
    const result = await this.createQueryBuilder('explicitExperimentIndividualInclusion')
      .insert()
      .into(ExperimentSegmentInclusion)
      .values(data)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentSegmentInclusionRepository',
          'insertExperimentSegmentInclusion',
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
  ): Promise<ExperimentSegmentInclusion> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(ExperimentSegmentInclusion)
      .where('segmentId=:segmentId AND experimentId=:experimentId', { segmentId, experimentId })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentSegmentInclusionRepository',
          'deleteExperimentSegmentInclusion',
          { segmentId, experimentId },
          errorMsg
        );
        logger.error(errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }
}