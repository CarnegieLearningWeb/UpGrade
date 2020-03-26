import { ExperimentAuditLog } from '../models/ExperimentAuditLog';
import { EntityRepository, Repository } from 'typeorm';
import { EXPERIMENT_LOG_TYPE } from 'ees_types';
import { User } from '../models/User';
import repositoryError from './utils/repositoryError';

@EntityRepository(ExperimentAuditLog)
export class ExperimentAuditLogRepository extends Repository<ExperimentAuditLog> {
  public async paginatedFind(limit: number, offset: number, filter: EXPERIMENT_LOG_TYPE): Promise<ExperimentAuditLog[]> {
    let queryBuilder = this.createQueryBuilder('audit')
      .skip(offset)
      .take(limit)
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC');

    if (filter) {
      queryBuilder = queryBuilder
        .where('audit.type = :filter', { filter });
    }
    return queryBuilder
      .getMany()
      .catch((error: any) => {
        const errorMsg = repositoryError('ExperimentAuditLogRepository', 'paginatedFind', { limit, offset }, error);
        throw new Error(errorMsg);
      });
  }

  public getTotalLogs(filter: EXPERIMENT_LOG_TYPE): Promise<number> {
    return this.createQueryBuilder('audit')
      .where('audit.type = :filter', { filter })
      .getCount()
      .catch((error: any) => {
        const errorMsg = repositoryError('ExperimentAuditLogRepository', 'paginatedFind', { filter }, error);
        throw new Error(errorMsg);
      });
  }

  public async saveRawJson(type: EXPERIMENT_LOG_TYPE, data: any, user: User): Promise<ExperimentAuditLog> {
    const result = await this.createQueryBuilder()
      .insert()
      .values({ type, data, user })
      .returning('*')
      .execute()
      .catch((error: any) => {
        const errorMsg = repositoryError('ExperimentAuditLogRepository', 'saveRawJson', { type, data, user }, error);
        throw new Error(errorMsg);
      });

    return result.raw;
  }
}
