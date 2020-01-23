import { Repository, EntityRepository, EntityManager } from 'typeorm';
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

  public async deleteById(ids: string[], entityManager: EntityManager): Promise<MonitoredExperimentPoint[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(MonitoredExperimentPoint)
      .where('id IN (:...ids)', { ids })
      .execute();

    return result.raw;
  }
}
