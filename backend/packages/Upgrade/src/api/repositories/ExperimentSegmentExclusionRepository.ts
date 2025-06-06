import { Repository, EntityManager } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
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
      .orIgnore()
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

  public async getExperimentSegmentExclusionData(): Promise<Partial<ExperimentSegmentExclusion>[]> {
    return this.createQueryBuilder('experimentSegmentExclusion')
      .leftJoin('experimentSegmentExclusion.experiment', 'experiment')
      .leftJoin('experimentSegmentExclusion.segment', 'segment')
      .leftJoinAndSelect('segment.subSegments', 'subSegments')
      .addSelect('experiment.name')
      .addSelect('experiment.state')
      .addSelect('experiment.context')
      .addSelect('segment.id')
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ExperimentSegmentExclusion', 'getdata', {}, errorMsg);
        throw errorMsgString;
      });
  }

  public async getExperimentSegmentExclusionDocBySegmentId(
    segmentId: string
  ): Promise<Partial<ExperimentSegmentExclusion[]>> {
    return this.createQueryBuilder('experimentSegmentExclusion')
      .leftJoin('experimentSegmentExclusion.experiment', 'experiment')
      .leftJoin('experimentSegmentExclusion.segment', 'segment')
      .leftJoinAndSelect('segment.subSegments', 'subSegments')
      .leftJoinAndSelect('segment.individualForSegment', 'individualForSegment')
      .leftJoinAndSelect('segment.groupForSegment', 'groupForSegment')
      .addSelect('experiment.assignmentUnit')
      .addSelect('experiment.consistencyRule')
      .addSelect('experiment.id')
      .addSelect('experiment.group')
      .where('"segment"."id" = :id', { id: segmentId })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ExperimentSegmentExclusion',
          'getExclusionSegmentUpdateDoc',
          {},
          errorMsg
        );
        throw errorMsgString;
      });
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
