import { Repository, EntityRepository } from 'typeorm';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';

type MonitoredExperimentPointInput = Omit<MonitoredExperimentPoint, 'createdAt' | 'updatedAt' | 'versionNumber'>;
@EntityRepository(MonitoredExperimentPoint)
export class MonitoredExperimentPointRepository extends Repository<MonitoredExperimentPoint> {
  public async saveRawJson(rawData: MonitoredExperimentPointInput): Promise<MonitoredExperimentPoint> {
    const result = await this.createQueryBuilder('monitoredPoint')
      .insert()
      .into(MonitoredExperimentPoint)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute();

    return result.raw;
  }
}
