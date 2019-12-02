import { Repository, EntityRepository, InsertResult } from 'typeorm';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
@EntityRepository(MonitoredExperimentPoint)
export class MonitoredExperimentPointRepository extends Repository<MonitoredExperimentPoint> {
  public saveRawJson(rawData: MonitoredExperimentPoint): Promise<InsertResult> {
    return this.createQueryBuilder('monitoredPoint')
      .insert()
      .into(MonitoredExperimentPoint)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute();
  }
}
