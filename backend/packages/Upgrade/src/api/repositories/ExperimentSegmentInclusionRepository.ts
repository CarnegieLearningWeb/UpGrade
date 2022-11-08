import { Repository, EntityRepository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';
import { UpgradeLogger } from 'src/lib/logger/UpgradeLogger';
import { ExperimentSegmentInclusion } from '../models/ExperimentSegmentInclusion';

@EntityRepository(ExperimentSegmentInclusion)
export class ExperimentSegmentInclusionRepository extends Repository<ExperimentSegmentInclusion> {
  public async insertData(
    data: Partial<ExperimentSegmentInclusion>,
    logger: UpgradeLogger,
    entityManager: EntityManager
  ): Promise<ExperimentSegmentInclusion> {
    const result = await entityManager
      .createQueryBuilder()
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

  public async getExperimentSegmentInclusionData(): Promise<Partial<ExperimentSegmentInclusion>[]> {
    return this.createQueryBuilder('experimentSegmentInclusion')
      .leftJoin('experimentSegmentInclusion.experiment', 'experiment')
      .leftJoin('experimentSegmentInclusion.segment', 'segment')
      .leftJoinAndSelect('segment.subSegments', 'subSegments')
      .addSelect('experiment.name')
      .addSelect('experiment.state')
      .addSelect('experiment.context')
      .addSelect('segment.id')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentSegmentInclusion', 'getdata', {}, errorMsg);
        throw errorMsgString;
      });
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
