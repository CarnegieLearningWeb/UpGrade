import { EntityRepository, Repository, EntityManager } from 'typeorm';
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
      .onConflict(`("id") DO UPDATE SET "query" = :query, "name" = :name, "repeatedMeasure" = :repeatedMeasure`)
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
}
