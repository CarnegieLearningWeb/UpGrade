import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';
import { LOG_TYPE } from 'upgrade_types';

@Service()
export class AuditService {
  constructor(
    @InjectRepository()
    private experimentAuditLogRepository: ExperimentAuditLogRepository
  ) {}

  public getTotalLogs(filter: LOG_TYPE): Promise<number> {
    if (filter) {
      return this.experimentAuditLogRepository.getTotalLogs(filter);
    }
    return this.experimentAuditLogRepository.count();
  }

  public getAuditLogs(limit: number, offset: number, filter?: LOG_TYPE): Promise<ExperimentAuditLog[]> {
    return this.experimentAuditLogRepository.paginatedFind(limit, offset, filter);
  }

  public getAuditLogByType(type: LOG_TYPE): Promise<ExperimentAuditLog[]> {
    return this.experimentAuditLogRepository.find({ where: { type } });
  }
}
