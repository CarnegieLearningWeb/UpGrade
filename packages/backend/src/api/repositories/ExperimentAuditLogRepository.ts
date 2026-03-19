import { ExperimentAuditLog } from '../models/ExperimentAuditLog';
import { Repository, EntityManager } from 'typeorm';
import { EntityRepository } from '../../typeorm-typedi-extensions';
import { LOG_TYPE } from 'upgrade_types';
import { UserDTO } from '../DTO/UserDTO';
import repositoryError from './utils/repositoryError';

export interface AuditLogQueryParams {
  take: number;
  skip: number;
  filter?: LOG_TYPE;
  experimentId?: string;
  flagId?: string;
}

@EntityRepository(ExperimentAuditLog)
export class ExperimentAuditLogRepository extends Repository<ExperimentAuditLog> {
  public async paginatedFind(logParams: AuditLogQueryParams): Promise<ExperimentAuditLog[]> {
    const { take, skip, filter, experimentId, flagId } = logParams;
    let queryBuilder = this.createQueryBuilder('audit')
      .offset(skip)
      .limit(take)
      .leftJoinAndSelect('audit.user', 'user')
      .orderBy('audit.createdAt', 'DESC');

    if (filter) {
      queryBuilder = queryBuilder.where('audit.type = :filter', { filter });
    }

    if (experimentId) {
      const experimentIdCondition = "(audit.data->>'experimentId' = :experimentId)";
      queryBuilder = filter
        ? queryBuilder.andWhere(experimentIdCondition, { experimentId })
        : queryBuilder.where(experimentIdCondition, { experimentId });
    }

    if (flagId) {
      const flagIdCondition = "(audit.data->>'flagId' = :flagId)";
      queryBuilder =
        filter || experimentId
          ? queryBuilder.andWhere(flagIdCondition, { flagId })
          : queryBuilder.where(flagIdCondition, { flagId });
    }

    return queryBuilder.getMany().catch((error: any) => {
      const errorMsg = repositoryError('ExperimentAuditLogRepository', 'paginatedFind', logParams, error);
      throw errorMsg;
    });
  }

  public getTotalLogs(logParams: Pick<AuditLogQueryParams, 'filter' | 'experimentId' | 'flagId'>): Promise<number> {
    const { filter, experimentId, flagId } = logParams;
    let queryBuilder = this.createQueryBuilder('audit');

    if (filter) {
      queryBuilder = queryBuilder.where('audit.type = :filter', { filter });
    }

    if (experimentId) {
      const experimentIdCondition = "(audit.data->>'experimentId' = :experimentId)";
      queryBuilder = filter
        ? queryBuilder.andWhere(experimentIdCondition, { experimentId })
        : queryBuilder.where(experimentIdCondition, { experimentId });
    }

    if (flagId) {
      const flagIdCondition = "(audit.data->>'flagId' = :flagId)";
      queryBuilder =
        filter || experimentId
          ? queryBuilder.andWhere(flagIdCondition, { flagId })
          : queryBuilder.where(flagIdCondition, { flagId });
    }

    return queryBuilder.getCount().catch((error: any) => {
      const errorMsg = repositoryError('ExperimentAuditLogRepository', 'getTotalLogs', logParams, error);
      throw errorMsg;
    });
  }

  public async saveRawJson(
    type: LOG_TYPE,
    data: any,
    user: UserDTO,
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
