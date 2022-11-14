import { Service } from 'typedi';

@Service()
export default class ExperimentExcludeServiceMock {
  public experimentExcludeUser(): Promise<[]> {
    return Promise.resolve([]);
  }
  public getExperimentUserById(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllExperimentUser(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public deleteExperimentUser(): Promise<[]> {
    return Promise.resolve([]);
  }

  public deleteExperimentGroup(): Promise<[]> {
    return Promise.resolve([]);
  }

  public experimentExcludeGroup(id: string, type: string): Promise<[]> {
    return Promise.resolve([]);
  }
  public getExperimentGroupById(id: string, type: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllExperimentGroups(): Promise<[]> {
    return Promise.resolve([]);
  }
}
