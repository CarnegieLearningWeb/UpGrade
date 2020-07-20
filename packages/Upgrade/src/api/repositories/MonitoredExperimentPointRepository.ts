import { EntityRepository, EntityManager, Repository } from 'typeorm';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import repositoryError from './utils/repositoryError';
import { ENROLLMENT_CODE } from 'upgrade_types';
import { ExperimentPartition } from '../models/ExperimentPartition';
import { IndividualAssignment } from '../models/IndividualAssignment';

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

  public async getMonitorExperimentPointForExport(offset: number, limit: number, monitorPointIds: string[], experimentId: string): Promise<any> {
    return this.createQueryBuilder('monitoredExperiment')
      .leftJoinAndSelect('monitoredExperiment.user', 'user')
      .leftJoinAndSelect('monitoredExperiment.monitoredPointLogs', 'monitoredPointLogs')
      .leftJoinAndMapOne(
        'monitoredExperiment.partition',
        ExperimentPartition,
        'experimentPartition',
        'monitoredExperiment.experimentId = "experimentPartition"."id"'
      )
      .leftJoinAndMapOne(
        'monitoredExperiment.assignment',
        IndividualAssignment,
        'individualAssignment',
        'user.id = "individualAssignment"."userId"'
      )
      .leftJoinAndSelect('individualAssignment.experiment', 'experiment')
      .leftJoinAndSelect('individualAssignment.condition', 'conditions')
      .where('monitoredExperiment.experimentId IN (:...ids)', { ids: monitorPointIds })
      .andWhere('experiment.id = :id', { id: experimentId })
      .skip(offset)
      .take(limit)
      .getMany()
      .catch((errorMsg: any) => {
        console.log('errormsg', errorMsg);
        const errorMsgString = repositoryError(this.constructor.name, 'getMonitorExperimentPointForExport', { monitorPointIds }, errorMsg);
        throw new Error(errorMsgString);
      });
  }

  public async getMonitoredExperimentPointCount(monitorPointIds: string[]): Promise<number> {
    return this.createQueryBuilder('monitoredExperiment')
      .where('monitoredExperiment.experimentId IN (:...ids)', { ids: monitorPointIds })
      .getCount()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'getMinitoredExperimentPointCount', { monitorPointIds }, errorMsg);
        throw new Error(errorMsgString);
      });
  }
}
