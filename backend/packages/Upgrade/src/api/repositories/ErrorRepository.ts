import { Repository, EntityRepository } from 'typeorm';
import { ExperimentError } from '../models/ExperimentError';
import repositoryError from './utils/repositoryError';
import { SERVER_ERROR } from 'upgrade_types';

@EntityRepository(ExperimentError)
export class ErrorRepository extends Repository<ExperimentError> {
  public async saveRawJson(error: ExperimentError): Promise<ExperimentError> {
    const result = await this.createQueryBuilder()
      .insert()
      .values(error)
      .returning('*')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ErrorRepository', 'saveRawJson', { error }, errorMsg);
        throw errorMsgString;
      });

    return result.raw && result.raw[0];
  }

  public async paginatedFind(limit: number, offset: number, filter: SERVER_ERROR): Promise<ExperimentError[]> {
    let queryBuilder = this.createQueryBuilder('error').skip(offset).take(limit).orderBy('error.createdAt', 'DESC');
    if (filter) {
      queryBuilder = queryBuilder.where('error.type = :filter', { filter });
    }
    return queryBuilder.getMany().catch((error: any) => {
      const errorMsg = repositoryError('ErrorRepository', 'paginatedFind', { limit, offset }, error);
      throw errorMsg;
    });
  }

  public getTotalLogs(filter: SERVER_ERROR): Promise<number> {
    return this.createQueryBuilder('error')
      .where('error.type = :filter', { filter })
      .getCount()
      .catch((error: any) => {
        const errorMsg = repositoryError('ErrorRepository', 'paginatedFind', { filter }, error);
        throw errorMsg;
      });
  }

  public async clearLogs(limit: number): Promise<ExperimentError[]> {
    // Fetch logs which we do not want to delete
    const errorLogOffset = await this.createQueryBuilder('error')
      .select('error.id')
      .orderBy('error.createdAt', 'DESC')
      .take(limit);

    const result = await this.createQueryBuilder()
      .delete()
      .from(ExperimentError)
      .where('id NOT IN (' + errorLogOffset.getQuery() + ')')
      .execute()
      .catch((errorMsg: any) => {
        const errorMsgString = repositoryError('ErrorRepository', 'clearLogs', {}, errorMsg);
        throw errorMsgString;
      });
    return result.raw;
  }
}
