import { Repository, EntityManager } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { Query } from '../models/Query';
import repositoryError from './utils/repositoryError';

@EntityRepository(Query)
export class QueryRepository extends Repository<Query> {
  public async deleteQuery(id: string, entityManager: EntityManager): Promise<void> {
    await entityManager
      .createQueryBuilder()
      .delete()
      .from(Query)
      .where('id=:id', { id })
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('QueryRepository', 'deleteQuery', { id }, errorMsg);
        throw errorMsgString;
      });
  }

  public async upsertQuery(queryDoc: Partial<Query>, entityManager: EntityManager): Promise<Query> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(Query)
      .values(queryDoc)
      .orUpdate(['query', 'name', 'metricKey', 'repeatedMeasure', 'order'], ['id'])
      .setParameter('query', queryDoc.query)
      .setParameter('name', queryDoc.name)
      .setParameter('metric', queryDoc.metric)
      .setParameter('repeatedMeasure', queryDoc.repeatedMeasure)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('QueryRepository', 'upsertQuery', { queryDoc }, errorMsg);
        throw errorMsgString;
      });

    return result.raw[0];
  }

  public async insertQueries(queryDoc: Array<Partial<Query>>, entityManager: EntityManager): Promise<Query> {
    const result = await entityManager
      .createQueryBuilder()
      .insert()
      .into(Query)
      .values(queryDoc)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('QueryRepository', 'insertQueries', { queryDoc }, errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }

  public async checkIfQueryExists(metricId: string): Promise<boolean> {
    const queryResult = await this.createQueryBuilder('query')
      .innerJoinAndSelect('query.metric', 'metric')
      .where('metric.key = :metricId', { metricId })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('QueryRepository', 'checkIfQueryExists', { metricId }, errorMsg);
        throw errorMsgString;
      });

    return queryResult.length > 0 ? true : false;
  }

  public async getMetricKeysWithQueries(): Promise<string[]> {
    const queryResult = await this.createQueryBuilder('query')
      .innerJoin('query.metric', 'metric')
      .distinct(true)
      .select('metric.key', 'metricKey')
      .getRawMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('QueryRepository', 'getMetricKeysWithQueries', {}, errorMsg);
        throw errorMsgString;
      });

    return queryResult.map((row: { metricKey: string }) => row.metricKey);
  }

  public async getExperimentsUsingMetricKey(
    key: string,
    metricJoinText: string
  ): Promise<Array<{ id: string; name: string }>> {
    const queryResult = await this.createQueryBuilder('query')
      .innerJoin('query.metric', 'metric')
      .innerJoin('query.experiment', 'experiment')
      .where('metric.key = :keyValue OR metric.key LIKE :key', { keyValue: key, key: `${key}${metricJoinText}%` })
      .distinct(true)
      .select('experiment.id', 'id')
      .addSelect('experiment.name', 'name')
      .getRawMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('QueryRepository', 'getExperimentsUsingMetricKey', { key }, errorMsg);
        throw errorMsgString;
      });

    return queryResult;
  }
}
