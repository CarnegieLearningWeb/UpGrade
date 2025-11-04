import { Experiment } from '../../../../src/api/models/Experiment';
import { User } from '../../../../src/api/models/User';
import { Service } from 'typedi';

@Service()
export default class ExperimentServiceMock {
  public find(): Promise<[]> {
    return Promise.resolve([]);
  }

  public findAllName(): Promise<[]> {
    return Promise.resolve([]);
  }

  public getContextMetaData(): Promise<[]> {
    return Promise.resolve([]);
  }

  public findPaginated(skip: number, take: number, sortParams?: any, searchParams?: any): Promise<[]> {
    return Promise.resolve([]);
  }

  public getTotalCount(): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllExperimentPartitions(): Promise<[]> {
    return Promise.resolve([]);
  }

  public getSingleExperiment(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public findOne(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public getExperimentalConditions(id: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public create(experiment: Experiment, currentUser: User): Promise<[]> {
    return Promise.resolve([]);
  }

  public delete(id: string, currentUser: User): Promise<[]> {
    return Promise.resolve([]);
  }

  public update(experiment: Experiment, currentUser: User): Promise<[]> {
    return Promise.resolve([]);
  }

  public updateState(id: string, state: string, currentUser: User, date?: any): Promise<[]> {
    return Promise.resolve([]);
  }

  public validateExperimentContext(experiment: Experiment): boolean {
    return false;
  }
}
