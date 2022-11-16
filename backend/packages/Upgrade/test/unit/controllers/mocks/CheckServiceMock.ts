import { Service } from 'typedi';

@Service()
export default class CheckServiceMock {
  public getAllGroupAssignments(): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllIndividualAssignment(): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllGroupExclusions(): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllIndividualExclusion(): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllMarkedExperimentPoints(): Promise<[]> {
    return Promise.resolve([]);
  }
}
