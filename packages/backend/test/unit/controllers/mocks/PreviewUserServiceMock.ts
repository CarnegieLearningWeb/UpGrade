import { Service } from 'typedi';
import { PreviewUser } from '../../../../src/api/models/PreviewUser';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

@Service()
export default class PreviewUserServiceMock {
  public findPaginated(skip: number, take: number, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public getTotalCount(logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public async findOne(id: string, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public create(user: Partial<PreviewUser>, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public update(id: string, user: PreviewUser, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public async delete(id: string, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public async upsertExperimentConditionAssignment(previewUser: PreviewUser, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
