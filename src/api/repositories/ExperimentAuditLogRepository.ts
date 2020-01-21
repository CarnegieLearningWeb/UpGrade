import { ExperimentAuditLog } from '../models/ExperimentAuditLog';
import { EntityRepository, Repository } from 'typeorm';
import { EXPERIMENT_LOG_TYPE } from 'ees_types';

@EntityRepository(ExperimentAuditLog)
export class ExperimentAuditLogRepository extends Repository<ExperimentAuditLog> {
  public async paginatedFind(limit: number, offset: number): Promise<ExperimentAuditLog[]> {
    return this.createQueryBuilder('audit')
      .skip(offset)
      .take(limit)
      .orderBy('audit.createdAt', 'DESC')
      .getMany();
  }

  public async saveRawJson(type: EXPERIMENT_LOG_TYPE, data: any): Promise<ExperimentAuditLog> {
    const result = await this.createQueryBuilder()
      .insert()
      .values({ type, data })
      .returning('*')
      .execute();

    return result.raw;
  }
}
