import { Service } from 'typedi';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

@Service()
export default class ScheduledJobServiceMock {
  public startExperiment(id: string): any {
    return {};
  }

  public endExperiment(id: string): any {
    return {};
  }
  public async clearLogs(logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
