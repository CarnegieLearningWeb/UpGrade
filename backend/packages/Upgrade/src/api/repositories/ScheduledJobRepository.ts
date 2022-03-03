import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { ScheduledJob } from '../models/ScheduledJob';
import repositoryError from './utils/repositoryError';

@EntityRepository(ScheduledJob)
export class ScheduledJobRepository extends Repository<ScheduledJob> {
  public async upsertScheduledJob(
    scheduledJob: Partial<ScheduledJob>,
    entityManager?: EntityManager
  ): Promise<ScheduledJob> {
    const that = entityManager ? entityManager : this;
    const result = await that
      .createQueryBuilder()
      .insert()
      .into(ScheduledJob)
      .values(scheduledJob)
      .onConflict(`("id") DO UPDATE SET "timeStamp" = :timeStamp, "executionArn" = :executionArn`)
      .setParameter('timeStamp', scheduledJob.timeStamp)
      .setParameter('executionArn', scheduledJob.executionArn)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ScheduledJobRepository',
          'upsertScheduledJob',
          { scheduledJob },
          errorMsg
        );
        throw errorMsgString;
      });

    return result.raw[0];
  }

  public async deleteByExperimentId(experimentId: string, entityManager: EntityManager): Promise<ScheduledJob[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(ScheduledJob)
      .where('experiment = :experimentId', { experimentId })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          'ScheduledJobRepository',
          'deleteByExperimentId',
          { experimentId },
          errorMsg
        );
        throw errorMsgString;
      });
    return result.raw;
  }
}
