import { Service } from 'typedi';
import { ILogInput } from 'upgrade_types';

@Service()
export default class ExperimentAssignmentServieMock {
  public markExperimentPoint(id: string, experimentPoint: string, condition: string, partitionId: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllExperimentConditions(userId: string, experimentContext: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public dataLog(userId: string, value: ILogInput[]): Promise<[]> {
    return Promise.resolve([]);
  }

  public blobDataLog(userId: string, blobData: any): Promise<[]> {
    return Promise.resolve([]);
  }

  public clientFailedExperimentPoint(
    reasone: string,
    experimentPoint: string,
    userId: string,
    experimentId: string
  ): Promise<[]> {
    return Promise.resolve([]);
  }
}
