import { Service } from 'typedi';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

@Service()
export default class QueryServiceMock {
  public analyze(queryIds: string[], logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
