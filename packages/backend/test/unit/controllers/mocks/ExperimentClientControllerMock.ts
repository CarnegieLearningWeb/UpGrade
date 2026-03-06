import { Service } from 'typedi';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

@Service()
export default class ExperimentClientControllerMock {
  public checkIfUserExist(userId: string, take: number, logger: UpgradeLogger, api?: string): Promise<[]> {
    return Promise.resolve([]);
  }
}
