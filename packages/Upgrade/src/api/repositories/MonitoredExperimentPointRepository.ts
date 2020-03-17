import { EntityRepository, EntityManager, Repository } from 'typeorm';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import repositoryError from './utils/repositoryError';

@EntityRepository(MonitoredExperimentPoint)
export class MonitoredExperimentPointRepository extends Repository<MonitoredExperimentPoint> {
  public async findForExperimentIdsUserIds(
    experimentIds: string[],
    userIds: string[]
  ): Promise<MonitoredExperimentPoint[]> {
    return this.createQueryBuilder('monitoredPoint')
      .where('monitoredPoint.id IN (:...experimentIds) AND monitoredPoint.userId IN (:...userIds)', {
        experimentIds,
        userIds,
      })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'findForUserIds',
          { experimentIds, userIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }

  public async saveRawJson(
    rawData: Omit<MonitoredExperimentPoint, 'createdAt' | 'updatedAt' | 'versionNumber'>
  ): Promise<MonitoredExperimentPoint> {
    const result = await this.createQueryBuilder('monitoredPoint')
      .insert()
      .into(MonitoredExperimentPoint)
      .values(rawData)
      .onConflict(`DO NOTHING`)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async deleteById(ids: string[], entityManager: EntityManager): Promise<MonitoredExperimentPoint[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(MonitoredExperimentPoint)
      .where('id IN (:...ids)', { ids })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'deleteById', { ids }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }
}
