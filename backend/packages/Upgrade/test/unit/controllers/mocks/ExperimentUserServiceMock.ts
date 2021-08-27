import { Service } from 'typedi';

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
}
