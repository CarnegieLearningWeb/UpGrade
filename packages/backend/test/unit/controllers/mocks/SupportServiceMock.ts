import { Service } from 'typedi';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

@Service()
export default class SupportService {
  public async getAssignments(userId: string, context: string, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
