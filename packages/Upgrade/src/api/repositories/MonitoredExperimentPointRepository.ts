import { EntityRepository, EntityManager, Repository } from 'typeorm';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import repositoryError from './utils/repositoryError';
import { ENROLLMENT_CODE } from 'upgrade_types';

@EntityRepository(MonitoredExperimentPoint)
export class MonitoredExperimentPointRepository extends Repository<MonitoredExperimentPoint> {
  public async saveRawJson(
    rawData: Omit<MonitoredExperimentPoint, 'createdAt' | 'updatedAt' | 'versionNumber' | 'id' | 'monitoredPointLogs'>
  ): Promise<MonitoredExperimentPoint> {
    const id = `${rawData.experimentId}_${rawData.user.id}`;
    const result = await this.createQueryBuilder('monitoredPoint')
      .insert()
      .into(MonitoredExperimentPoint)
      .values({ id, ...rawData })
      .onConflict(`("id") DO UPDATE SET "experimentId" = :experimentId`)
      .setParameter('experimentId', rawData.experimentId)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'saveRawJson', { rawData }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw.length > 0 ? result.raw[0] : {};
  }

  public async deleteByExperimentId(ids: string[], entityManager: EntityManager): Promise<MonitoredExperimentPoint[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(MonitoredExperimentPoint)
      .where('experimentId IN (:...ids)', { ids })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'deleteByExperimentId', { ids }, errorMsg);
        throw new Error(errorMsgString);
      });

    return result.raw;
  }

  public async getByDateRange(ids: string[], from: Date, to: Date): Promise<MonitoredExperimentPoint[]> {
    const qb = this.createQueryBuilder('monitoredExperiment')
      .leftJoinAndSelect('monitoredExperiment.user', 'user')
      .where('monitoredExperiment.experimentId IN (:...ids)', { ids });
    let searchText = '';
    if (from) {
      searchText = searchText + 'monitoredExperiment.createdAt > :from';
    }
    if (to) {
      searchText = searchText + ' AND monitoredExperiment.createdAt < :to';
    }

    return qb
      .andWhere(searchText, { from, to })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'getByDateRange', { ids, from, to }, errorMsg);
        throw new Error(errorMsgString);
      });
  }

  public async updateEnrollmentCode(
    enrollmentCode: ENROLLMENT_CODE,
    ids: string[]
  ): Promise<MonitoredExperimentPoint[]> {
    const result = await this.createQueryBuilder('monitoredExperiment')
      .update()
      .set({ enrollmentCode })
      .where('id IN (:...values) AND enrollmentCode is null', { values: ids })
      .execute();

    return result.raw;
  }
}
