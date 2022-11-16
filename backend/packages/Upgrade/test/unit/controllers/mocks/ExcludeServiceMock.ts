import { Service } from 'typedi';

@Service()
export default class ExcludeServiceMock {
  public getAllUser(): Promise<[]> {
    return Promise.resolve([]);
  }
  public excludeUser(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public deleteUser(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllGroups(): Promise<[]> {
    return Promise.resolve([]);
  }

  public excludeGroup(id: string, type: string): Promise<[]> {
    return Promise.resolve([]);
  }
  public deleteGroup(id: string, type: string): Promise<[]> {
    return Promise.resolve([]);
  }
}
