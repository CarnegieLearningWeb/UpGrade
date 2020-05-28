import { EntityRepository, Repository, EntityManager, getRepository } from 'typeorm';
import { Log } from '../models/Log';
import repositoryError from './utils/repositoryError';
import { Experiment } from '../models/Experiment';
import { IndividualAssignment } from '../models/IndividualAssignment';
import { OPERATION_TYPES } from 'upgrade_types';

@EntityRepository(Log)
export class LogRepository extends Repository<Log> {
  public async deleteExceptByIds(values: string[], entityManager: EntityManager): Promise<Log[]> {
    if (values.length > 0) {
      const result = await entityManager
        .createQueryBuilder()
        .delete()
        .from(Log)
        .where('id NOT IN (:...values)', { values })
        .execute()
        .catch((errorMsg: any) => {
          const errorMsgString = repositoryError(this.constructor.name, 'deleteExceptByIds', { values }, errorMsg);
          throw new Error(errorMsgString);
        });

      return result.raw;
    } else {
      const result = await entityManager
        .createQueryBuilder()
        .delete()
        .from(Log)
        .execute()
        .catch((errorMsg: any) => {
          const errorMsgString = repositoryError(this.constructor.name, 'deleteExceptByIds', { values }, errorMsg);
          throw new Error(errorMsgString);
        });

      return result.raw;
    }
  }

  public async analysis(
    experimentId: string,
    metric: string[],
    operationTypes: OPERATION_TYPES,
    timeRange: any
  ): Promise<any> {
    // get experiment repository
    const experimentRepo = getRepository(Experiment);
    const metricId = metric.join('_');
    const metricString = metric.reduce((accumulator: string, value: string) => {
      return accumulator !== '' ? `${accumulator} -> '${value}'` : `'${value}'`;
    }, '');

    // SUM operation
    return experimentRepo
      .createQueryBuilder('experiment')
      .select([
        '"individualAssignment"."conditionId"',
        `${operationTypes}(cast(logs.data -> ${metricString} as decimal)) as result`,
      ])
      .innerJoin('experiment.metrics', 'metrics')
      .innerJoin('metrics.logs', 'logs')
      .innerJoin(
        IndividualAssignment,
        'individualAssignment',
        'experiment.id = "individualAssignment"."experimentId" AND logs."userId" = "individualAssignment"."userId"'
      )
      .where('metrics.key = :metric', { metric: metricId })
      .andWhere('experiment.id = :experimentId', { experimentId })
      .groupBy('"individualAssignment"."conditionId"')
      .getRawMany();
  }
}
