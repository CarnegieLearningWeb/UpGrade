import { Service } from 'typedi';
import { SERVER_ERROR } from 'upgrade_types';
import { ExperimentError } from '../../../../src/api/models/ExperimentError';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

@Service()
export default class ErrorServiceMock {
  public getTotalLogs(filter: SERVER_ERROR): Promise<[]> {
    return Promise.resolve([]);
  }

  public getErrorLogs(limit: number, offset: number, filter: SERVER_ERROR): Promise<[]> {
    return Promise.resolve([]);
  }

  public create(error: ExperimentError, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
