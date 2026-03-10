import { Service } from 'typedi';

@Service()
export default class ExperimentIncludeServiceMock {
  public experimentIncludeUser(): Promise<[]> {
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

  public experimentIncludeGroup(id: string, type: string): Promise<[]> {
    return Promise.resolve([]);
  }
  public getExperimentGroupById(id: string, type: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllExperimentGroups(): Promise<[]> {
    return Promise.resolve([]);
  }
}
