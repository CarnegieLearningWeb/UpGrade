import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';
import { EXPERIMENT_LOG_TYPE } from 'upgrade_types';

@Service()
export class AuditService {
  constructor(
    @OrmRepository()
    private experimentAuditLogRepository: ExperimentAuditLogRepository
  ) {}

  public getTotalLogs(filter: EXPERIMENT_LOG_TYPE): Promise<number> {
    if (filter) {
      return this.experimentAuditLogRepository.getTotalLogs(filter);
    }
    return this.experimentAuditLogRepository.count();
  }

  public getAuditLogs(limit: number, offset: number, filter?: EXPERIMENT_LOG_TYPE): Promise<ExperimentAuditLog[]> {
    return this.experimentAuditLogRepository.paginatedFind(limit, offset, filter);
  }

  public getAuditLogByType(type: EXPERIMENT_LOG_TYPE): Promise<ExperimentAuditLog[]> {
    return this.experimentAuditLogRepository.find({ type });
  }
}
