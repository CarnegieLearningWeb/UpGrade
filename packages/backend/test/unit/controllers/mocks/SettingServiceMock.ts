import { Service } from 'typedi';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

@Service()
export default class SettingServiceMock {
  public getClientCheck(logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public setClientCheck(checkAuth: boolean | null, filterMetric: boolean | null, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
