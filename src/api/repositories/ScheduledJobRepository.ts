import { Repository, EntityRepository } from 'typeorm';
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
}
