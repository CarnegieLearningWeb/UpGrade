import { Service } from 'typedi';
import { InjectRepository } from '../../typeorm-typedi-extensions';
import { ExperimentAuditLogRepository } from '../repositories/ExperimentAuditLogRepository';
import { ExperimentAuditLog } from '../models/ExperimentAuditLog';
import { EXPERIMENT_STATE_DISPLAY_NAME_OVERRIDES, LOG_TYPE } from 'upgrade_types';

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

  public async getAuditLogs(limit: number, offset: number, filter?: LOG_TYPE): Promise<ExperimentAuditLog[]> {
    const logs = await this.experimentAuditLogRepository.paginatedFind(limit, offset, filter);
    return logs.map((log) => this.convertStateStrings(log));
  }

  public async getAuditLogByType(type: LOG_TYPE): Promise<ExperimentAuditLog[]> {
    const logs = await this.experimentAuditLogRepository.find({ where: { type } });
    return logs.map((log) => this.convertStateStrings(log));
  }

  private convertStateStrings(log: ExperimentAuditLog): ExperimentAuditLog {
    if (log.type === LOG_TYPE.EXPERIMENT_STATE_CHANGED) {
      const data = log.data as any;
      return {
        ...log,
        data: {
          ...log.data,
          previousState: EXPERIMENT_STATE_DISPLAY_NAME_OVERRIDES[data.previousState as string] || data.previousState,
          newState: EXPERIMENT_STATE_DISPLAY_NAME_OVERRIDES[data.newState as string] || data.newState,
        },
      };
    }
    return log;
  }
}
