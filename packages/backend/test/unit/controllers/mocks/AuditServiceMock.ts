import { Service } from 'typedi';
import { DATE_RANGE } from 'upgrade_types';
import { AuditLogQueryParams } from '../../../../src/api/repositories/ExperimentAuditLogRepository';

@Service()
export default class AuditServiceMock {
  public getEnrollments(experimentIds: string[]): Promise<[]> {
    return Promise.resolve([]);
  }

  public getDetailEnrollment(experimentId: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public getEnrollmentStatsByDate(experimentId: string, dateEnum: DATE_RANGE, clientOffset: number): Promise<[]> {
    return Promise.resolve([]);
  }

  public exportCSVData(experimentId: string, email: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public getTotalLogs(logParams: Pick<AuditLogQueryParams, 'filter' | 'experimentId' | 'flagId'>): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAuditLogs(logParams: AuditLogQueryParams): Promise<[]> {
    return Promise.resolve([]);
  }
}
