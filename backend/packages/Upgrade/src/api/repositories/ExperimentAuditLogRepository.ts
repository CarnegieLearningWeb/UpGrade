import { ExperimentAuditLog } from '../models/ExperimentAuditLog';
import { Repository, EntityManager } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { LOG_TYPE } from 'upgrade_types';
import { User } from '../models/User';
import repositoryError from './utils/repositoryError';

@EntityRepository(ExperimentAuditLog)
export class ExperimentAuditLogRepository extends Repository<ExperimentAuditLog> {
  public async paginatedFind(limit: number, offset: number, filter: LOG_TYPE): Promise<ExperimentAuditLog[]> {
    let queryBuilder = this.createQueryBuilder('audit')
      .offset(offset)
      .limit(limit)
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC');

    if (filter) {
      queryBuilder = queryBuilder.where('audit.type = :filter', { filter });
    }
    return queryBuilder.getMany().catch((error: any) => {
      const errorMsg = repositoryError('ExperimentAuditLogRepository', 'paginatedFind', { limit, offset }, error);
      throw errorMsg;
    });
  }

  public getTotalLogs(filter: LOG_TYPE): Promise<number> {
    return this.createQueryBuilder('audit')
      .where('audit.type = :filter', { filter })
      .getCount()
      .catch((error: any) => {
        const errorMsg = repositoryError('ExperimentAuditLogRepository', 'paginatedFind', { filter }, error);
        throw errorMsg;
      });
  }

  public async saveRawJson(
    type: LOG_TYPE,
    data: any,
    user: User,
    entityManger?: EntityManager
  ): Promise<ExperimentAuditLog> {
    const that = entityManger || this;
    const result = await that
      .createQueryBuilder()
      .insert()
      .into(ExperimentAuditLog)
      .values({ type, data, user })
      .returning('*')
      .execute()
      .catch((error: any) => {
        const errorMsg = repositoryError('ExperimentAuditLogRepository', 'saveRawJson', { type, data, user }, error);
        throw errorMsg;
      });

    return result.raw;
  }

  public async clearLogs(limit: number): Promise<ExperimentAuditLog[]> {
    // Fetch logs which we do not want to delete
    const auditLogOffset = await this.createQueryBuilder('audit')
      .select('audit.id')
      .orderBy('audit.createdAt', 'DESC')
      .limit(limit);

    const result = await this.createQueryBuilder()
      .delete()
      .from(ExperimentAuditLog)
      .where('id NOT IN (' + auditLogOffset.getQuery() + ')')
      .execute()
      .catch((error: any) => {
        const errorMsgString = repositoryError('ExperimentAuditLogRepository', 'clearLogs', {}, error);
        throw errorMsgString;
      });

    return result.raw;
  }
}
