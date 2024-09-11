import { Service } from 'typedi';
import { DATE_RANGE } from 'upgrade_types';
import { LOG_TYPE } from 'upgrade_types';

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

  public getCSVData(experimentId: string, email: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public getTotalLogs(filter: LOG_TYPE): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAuditLogs(limit: number, offset: number, filter?: LOG_TYPE): Promise<[]> {
    return Promise.resolve([]);
  }
}
