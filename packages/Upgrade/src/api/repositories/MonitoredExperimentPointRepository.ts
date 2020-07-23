import { EntityRepository, EntityManager, Repository, getConnection } from 'typeorm';
import { MonitoredExperimentPoint } from '../models/MonitoredExperimentPoint';
import repositoryError from './utils/repositoryError';
import { ENROLLMENT_CODE } from 'upgrade_types';
import { ExperimentPartition } from '../models/ExperimentPartition';
import { IndividualAssignment } from '../models/IndividualAssignment';
import { ExperimentUser } from '../models/ExperimentUser';
import { MonitoredExperimentPointLog } from '../models/MonitorExperimentPointLog';

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

  public async getMonitorExperimentPointForExport(
    offset: number,
    limit: number,
    monitorPointIds: string[],
    experimentId: string
  ): Promise<any> {
    // return this.createQueryBuilder('monitoredExperiment')
    //   .select([
    //     'user.id',
    //     'monitoredExperiment.enrollmentCode',
    //     'monitoredExperiment.experimentId',
    //     'monitoredPointLogs.createdAt',
    //     'conditions.name',
    //     'experiment.id',
    //     'logs.data',
    //     'experiment.group',
    //   ])
    //   .leftJoin('monitoredExperiment.user', 'user')
    //   .leftJoin('monitoredExperiment.monitoredPointLogs', 'monitoredPointLogs')
    //   .leftJoin(
    //     ExperimentPartition,
    //     'experimentPartition',
    //     'monitoredExperiment.experimentId = "experimentPartition"."id"'
    //   )
    //   .leftJoin(IndividualAssignment, 'individualAssignment', 'user.id = "individualAssignment"."userId"')
    //   .leftJoin('individualAssignment.experiment', 'experiment')
    //   .leftJoin('individualAssignment.condition', 'conditions')
    //   .innerJoin('experiment.queries', 'queries')
    //   .innerJoin('queries.metric', 'metric')
    //   .innerJoin('metric.logs', 'logs', 'logs."userId" = user.id')
    //   .where('monitoredExperiment.experimentId IN (:...ids)', { ids: monitorPointIds })
    //   .andWhere('experiment.id = :id', { id: experimentId })
    //   .skip(offset)
    //   .take(limit)
    //   .groupBy('user.id')
    //   .addGroupBy('monitoredExperiment.experimentId')
    //   .addGroupBy('monitoredExperiment.enrollmentCode')
    //   .addGroupBy('monitoredPointLogs.createdAt')
    //   .addGroupBy('conditions.name')
    //   .addGroupBy('experiment.id')
    //   .addGroupBy('experiment.group')
    //   .addGroupBy('logs.data')
    //   .execute()
    //   .catch((errorMsg: any) => {
    //     console.log('errormsg', errorMsg);
    //     const errorMsgString = repositoryError(
    //       this.constructor.name,
    //       'getMonitorExperimentPointForExport',
    //       { monitorPointIds },
    //       errorMsg
    //     );
    //     throw new Error(errorMsgString);
    //   });

    return (
      getConnection()
        .createQueryBuilder()
        .select([
          'user.id',
          '"monitoredExperiment"."enrollmentCode"',
          '"monitoredExperiment"."experimentId"',
          // 'monitoredPointLogs.createdAt',
          'conditions.conditionCode',
          'experiment.id',
          'logs.data',
          'experiment.group',
          'partition.expId',
          'partition.expPoint',
        ])
        .from((subQuery) => {
          return subQuery
            .select('*')
            .from(MonitoredExperimentPoint, 'monitoredExperiment')
            .where('"monitoredExperiment"."experimentId" IN (:...ids)', { ids: monitorPointIds })
            .skip(offset)
            .take(limit);
        }, 'monitoredExperiment')
        // .leftJoin(
        //   MonitoredExperimentPointLog,
        //   '"monitoredLog"',
        //   '"monitoredExperiment"."id" = "monitoredLog"."monitoredExperimentPointId"'
        // )
        .leftJoin(ExperimentUser, 'user', 'user.id = "monitoredExperiment"."userId"')
        .leftJoin(IndividualAssignment, 'individualAssignment', 'user.id = "individualAssignment"."userId"')
        .leftJoin(
          ExperimentPartition,
          'partition',
          'monitoredExperiment.experimentId = "partition"."id"'
        )
        .leftJoin('individualAssignment.experiment', 'experiment')
        .leftJoin('individualAssignment.condition', 'conditions')
        .leftJoin('experiment.queries', 'queries')
        .leftJoin('queries.metric', 'metric')
        .leftJoin('metric.logs', 'logs', 'logs."userId" = user.id')
        .where('experiment.id = :id', { id: experimentId })
        .groupBy('user.id')
        .addGroupBy('"monitoredExperiment"."experimentId"')
        .addGroupBy('"monitoredExperiment"."enrollmentCode"')
        // .addGroupBy('monitoredPointLogs.createdAt')
        .addGroupBy('conditions.conditionCode')
        .addGroupBy('partition.expId')
        .addGroupBy('partition.expPoint')
        .addGroupBy('experiment.id')
        .addGroupBy('experiment.group')
        .addGroupBy('logs.data')
        .execute()
    );
  }

  public async getMonitoredExperimentPointCount(monitorPointIds: string[]): Promise<number> {
    return this.createQueryBuilder('monitoredExperiment')
      .where('monitoredExperiment.experimentId IN (:...ids)', { ids: monitorPointIds })
      .getCount()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'getMinitoredExperimentPointCount',
          { monitorPointIds },
          errorMsg
        );
        throw new Error(errorMsgString);
      });
  }
}
