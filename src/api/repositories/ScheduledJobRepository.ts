import { Repository, EntityRepository, EntityManager } from 'typeorm';
import { ScheduledJob } from '../models/ScheduledJob';

@EntityRepository(ScheduledJob)
export class ScheduledJobRepository extends Repository<ScheduledJob> {
  public async upsertScheduledJob(scheduledJob: Partial<ScheduledJob>): Promise<ScheduledJob> {
    const result = await this.createQueryBuilder('scheduled')
      .insert()
      .values(scheduledJob)
      .onConflict(`("id") DO UPDATE SET "timeStamp" = :timeStamp`)
      .setParameter('timeStamp', scheduledJob.timeStamp)
      .returning('*')
      .execute();

    return result.raw[0];
  }

  public async deleteByExperimentId(experimentId: string, entityManager: EntityManager): Promise<ScheduledJob[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(ScheduledJob)
      .where('experimentId = :experimentId', { experimentId })
      .execute();

    return result.raw;
  }
}
