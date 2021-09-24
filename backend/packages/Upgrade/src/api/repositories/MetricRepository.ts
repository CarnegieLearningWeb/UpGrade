import { Metric } from '../models/Metric';
import { EntityRepository, Repository } from 'typeorm';
import repositoryError from './utils/repositoryError';

@EntityRepository(Metric)
export class MetricRepository extends Repository<Metric> {
  public async deleteMetricsByKeys(key: string, metricJoinText: string): Promise<Metric[]> {
    const result = await this.createQueryBuilder()
      .delete()
      .from(Metric)
      .where('key LIKE :key OR key = :keyValue', { key: key + metricJoinText + '%', keyValue: key })
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'deleteMetricsByKeys', { key }, errorMsg);
        throw errorMsgString;
      });

    return result.raw;
  }

  public async getMetricsByKeys(key: string, metricJoinText: string): Promise<Metric[]> {
    return await this.createQueryBuilder()
      .where('key LIKE :key OR key = :keyValue', { key: key + metricJoinText + '%', keyValue: key })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'getMetricsByKeys', { key }, errorMsg);
        throw errorMsgString;
      });
  }

  public async findMetricsWithQueries(ids: string[]): Promise<Metric[]> {
    return this.createQueryBuilder('metrics')
      .innerJoin('metrics.queries', 'queries')
      .where('key IN (:...ids)', { ids })
      .getMany()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError(this.constructor.name, 'findMetricsWithQueries', { ids }, errorMsg);
        throw errorMsgString;
      });
  }
}
