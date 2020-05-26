import { Metric } from '../models/Metric';
import { EntityRepository, Repository, EntityManager } from 'typeorm';
import repositoryError from './utils/repositoryError';

@EntityRepository(Metric)
export class MetricRepository extends Repository<Metric> {
  public async deleteExceptByIds(values: string[], entityManager: EntityManager): Promise<Metric[]> {
    if (values.length > 0) {
      const result = await entityManager
        .createQueryBuilder()
        .delete()
        .from(Metric)
        .where('key NOT IN (:...values)', { values })
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
        .from(Metric)
        .execute()
        .catch((errorMsg: any) => {
          const errorMsgString = repositoryError(this.constructor.name, 'deleteExceptByIds', { values }, errorMsg);
          throw new Error(errorMsgString);
        });

      return result.raw;
    }
  }
}
