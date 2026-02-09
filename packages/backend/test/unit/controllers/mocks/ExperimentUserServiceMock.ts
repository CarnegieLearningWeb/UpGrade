import { Service } from 'typedi';
import { ExperimentUser } from '../../../../src/api/models/ExperimentUser';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { RequestedExperimentUser } from '../../../../src/api/controllers/validators/ExperimentUserValidator';

@Service()
export default class ExperimentUserServiceMock {
  public create(array: Array<any>): Promise<any> {
    return Promise.resolve(array);
  }

  public updateGroupMembership(id: string, group: object): Promise<[]> {
    return Promise.resolve([]);
  }

  public updateWorkingGroup(id: string, workingGroup: any): Promise<[]> {
    return Promise.resolve([]);
  }

  public setAliasesForUser(userId: string, aliases: string[]): Promise<[]> {
    return Promise.resolve([]);
  }

  public getUserDoc(userId: string, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }

  public upsertOnChange(
    oldExperimentUser: RequestedExperimentUser,
    newExperimentUser: Partial<ExperimentUser>,
    logger: UpgradeLogger
  ): Promise<[{ id: string }]> {
    return Promise.resolve([{ id: '123' }]);
  }

  public async getUserDocs(userIds: string[], logger: any): Promise<any[]> {
    // Mock user documents
    return userIds.map((userId) => ({
      id: userId,
      originalUser: {
        id: userId,
        firstName: 'Test',
        lastName: 'User',
        email: `test-${userId}@example.com`,
      },
    }));
  }

  public find(logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
  public findOne(id: string, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
  public update(id: string, user: ExperimentUser, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
  }
}
