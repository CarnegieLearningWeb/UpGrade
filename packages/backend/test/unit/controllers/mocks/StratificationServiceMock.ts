import { Service } from 'typedi';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { StratificationInputValidator } from 'src/api/controllers/validators/StratificationValidator';

@Service()
export default class StratificationServiceMock {
  public getAllStratification(logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public getStratificationByFactor(factor: string, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public getCSVDataByFactor(factor: string, logger: UpgradeLogger): Promise<string> {
    return Promise.resolve(' ');
  }

  public deleteStratification(factor: string, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public insertStratificationFiles(
    userStratificationData: StratificationInputValidator[],
    logger: UpgradeLogger
  ): Promise<[]> {
    return Promise.resolve([]);
  }
}
