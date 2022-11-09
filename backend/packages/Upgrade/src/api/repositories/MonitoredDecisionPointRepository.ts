import { EntityRepository, EntityManager, Repository } from 'typeorm';
import { MonitoredDecisionPoint } from '../models/MonitoredDecisionPoint';
import repositoryError from './utils/repositoryError';

@EntityRepository(MonitoredDecisionPoint)
export class MonitoredDecisionPointRepository extends Repository<MonitoredDecisionPoint> {
  public async saveRawJson(
    rawData: Omit<MonitoredDecisionPoint, 'createdAt' | 'updatedAt' | 'versionNumber' | 'monitoredPointLogs'>
    // experimentId: string, condition: string, user: ExperimentUser, site: string, target: string): Promise<MonitoredDecisionPoint> {
  ): Promise<MonitoredDecisionPoint> {
    const result = await this.createQueryBuilder('monitoredPoint')
      .insert()
      .into(MonitoredDecisionPoint)
      .values({ ...rawData })
      .onConflict(`("id") DO UPDATE SET "site" = :site, "target" = :target`)
      .setParameter('site', rawData.site)
      .setParameter('target', rawData.target)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'saveRawJson', { rawData }, errorMsg);
        throw errorMsgString;
      });

    return result.raw.length > 0 ? result.raw[0] : {};
  }

  public async deleteByExperimentId(ids: string[], entityManager: EntityManager): Promise<MonitoredDecisionPoint[]> {
    const result = await entityManager
      .createQueryBuilder()
      .delete()
      .from(MonitoredDecisionPoint)
      .where('experimentId IN (:...ids)', { ids })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'deleteByExperimentId', { ids }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async getByDateRange(ids: string[], from: Date, to: Date): Promise<MonitoredDecisionPoint[]> {
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
        throw errorMsgString;
      });
  }

  // public async getMonitorExperimentPointForExport(
  //   offset: number,
  //   limit: number,
  //   monitorPointIds: string[],
  //   experimentId: string,
  //   connectionName: string,
  // ): Promise<any> {
  //   return getConnection(connectionName)
  //     .createQueryBuilder()
  //     .select([
  //       'user.id',
  //       '"monitoredExperiment"."enrollmentCode"',
  //       '"monitoredExperiment"."experimentId"',
  //       'conditions.conditionCode',
  //       'experiment.id',
  //       'logs.data',
  //       'logs.uniquifier',
  //       'experiment.group',
  //       'partition.expId',
  //       'partition.expPoint',
  //       'metric.key',
  //     ])
  //     .from((subQuery) => {
  //       return subQuery
  //         .select('*')
  //         .from(MonitoredExperimentPoint, 'monitoredExperiment')
  //         .where('"monitoredExperiment"."experimentId" IN (:...ids)', { ids: monitorPointIds })
  //         .skip(offset)
  //         .take(limit);
  //     }, 'monitoredExperiment')
  //     .leftJoin(ExperimentUser, 'user', 'user.id = "monitoredExperiment"."userId"')
  //     .leftJoin(IndividualAssignment, 'individualAssignment', 'user.id = "individualAssignment"."userId"')
  //     .leftJoin(ExperimentPartition, 'partition', '"monitoredExperiment"."experimentId" = "partition"."id"')
  //     .leftJoin('individualAssignment.experiment', 'experiment')
  //     .leftJoin('individualAssignment.condition', 'conditions')
  //     .leftJoin('experiment.queries', 'queries')
  //     .leftJoin('queries.metric', 'metric')
  //     .leftJoin('metric.logs', 'logs', 'logs."userId" = user.id')
  //     .where('experiment.id = :id', { id: experimentId })
  //     .groupBy('user.id')
  //     .addGroupBy('"monitoredExperiment"."experimentId"')
  //     .addGroupBy('"monitoredExperiment"."enrollmentCode"')
  //     .addGroupBy('conditions.conditionCode')
  //     .addGroupBy('partition.expId')
  //     .addGroupBy('partition.expPoint')
  //     .addGroupBy('experiment.id')
  //     .addGroupBy('experiment.group')
  //     .addGroupBy('logs.data')
  //     .addGroupBy('logs.uniquifier')
  //     .addGroupBy('metric.key')
  //     .execute()
  //     .catch((errorMsg: any) => {
  //       const errorMsgString = repositoryError(
  //         this.constructor.name,
  //         'getMonitorExperimentPointForExport',
  //         { offset, limit, monitorPointIds, experimentId },
  //         errorMsg
  //       );
  //       throw errorMsgString;
  //     });
  // }

  public async getMonitoredExperimentPointCount(monitorPointIds: string[]): Promise<number> {
    return this.createQueryBuilder('monitoredExperiment')
      .where('monitoredExperiment.experimentId IN (:...ids)', { ids: monitorPointIds })
      .getCount()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(
          this.constructor.name,
          'getMonitoredExperimentPointCount',
          { monitorPointIds },
          errorMsg
        );
        throw errorMsgString;
      });
  }
}
