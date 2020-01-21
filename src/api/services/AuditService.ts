import { Service } from 'typedi';
import { OrmRepository } from 'typeorm-typedi-extensions';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';
import { EXPERIMENT_LOG_TYPE } from 'ees_types';

@Service()
export class AuditService {
  constructor(
    @OrmRepository()
    private experimentAuditLogRepository: ExperimentAuditLogRepository
  ) {}

  public getTotalLogs(): Promise<number> {
    return this.experimentAuditLogRepository.count();
  }

  public getAuditLogs(limit: number, offset: number): Promise<ExperimentAuditLog[]> {
    return this.experimentAuditLogRepository.paginatedFind(limit, offset);
  }

  public getAuditLogByType(type: EXPERIMENT_LOG_TYPE): Promise<ExperimentAuditLog[]> {
    return this.experimentAuditLogRepository.find({ type });
  }
}
