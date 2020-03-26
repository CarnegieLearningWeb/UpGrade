import { Repository, EntityRepository } from 'typeorm';
import { ExperimentError } from '../models/ExperimentError';
import repositoryError from './utils/repositoryError';
import { SERVER_ERROR } from 'ees_types';

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
        throw new Error(errorMsgString);
      });

    return result.raw && result.raw[0];
  }

  public async paginatedFind(limit: number, offset: number, filter: SERVER_ERROR): Promise<ExperimentError[]> {
    let queryBuilder = this.createQueryBuilder('error')
      .skip(offset)
      .take(limit)
      .orderBy('error.createdAt', 'DESC');
    if (filter) {
      queryBuilder = queryBuilder
        .where('error.type = :filter', { filter });
    }
    return queryBuilder
      .getMany()
      .catch((error: any) => {
        const errorMsg = repositoryError('ErrorRepository', 'paginatedFind', { limit, offset }, error);
        throw new Error(errorMsg);
      });
  }

  public getTotalLogs(filter: SERVER_ERROR): Promise<number> {
    return this.createQueryBuilder('error')
      .where('error.type = :filter', { filter })
      .getCount()
      .catch((error: any) => {
        const errorMsg = repositoryError('ErrorRepository', 'paginatedFind', { filter }, error);
        throw new Error(errorMsg);
      });
  }
}
