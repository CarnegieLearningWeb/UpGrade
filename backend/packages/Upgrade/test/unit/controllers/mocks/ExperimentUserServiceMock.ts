import { Service } from 'typedi';
import { ExperimentUser } from '../../../../src/api/models/ExperimentUser';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

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

  public getOriginalUserDoc(userId: string, logger: UpgradeLogger): Promise<[]> {
    return Promise.resolve([]);
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
