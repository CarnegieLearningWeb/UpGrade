import { Service } from 'typedi';
import { IExperimentAssignmentv5 } from 'types/src';
import { ILogInput } from 'upgrade_types';
import { v4 as uuid } from 'uuid';

@Service()
export default class ExperimentAssignmentServiceMock {
  public markExperimentPoint(id: string, experimentPoint: string, condition: string, partitionId: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public getAllExperimentConditions(userId: string, experimentContext: string): Promise<[]> {
    return Promise.resolve([]);
  }

  public formatAssignments(assignments: IExperimentAssignmentv5[]): IExperimentAssignmentv5[] {
    return [];
  }

  public async getBatchExperimentConditions(
    userDocs: any[],
    context: string,
    site: string,
    target: string,
    logger: any
  ): Promise<Record<string, any>> {
    // Mock response matching the controller's expected return type
    const assignments = {};

    userDocs.forEach((userDoc) => {
      assignments[userDoc.id] = {
        site,
        target,
        experimentType: 'Simple',
        assignedCondition: [
          {
            conditionCode: 'control',
            payload: {
              type: 'string',
              value: 'Control Content',
            },
            id: uuid(),
            experimentId: uuid(),
          },
        ],
      };
    });

    return assignments;
  }
  public dataLog(userId: string, value: ILogInput[]): Promise<[]> {
    return Promise.resolve([]);
  }

  public blobDataLog(userId: string, blobData: any): Promise<[]> {
    return Promise.resolve([]);
  }

  public clientFailedExperimentPoint(
    reason: string,
    experimentPoint: string,
    userId: string,
    experimentId: string
  ): Promise<[]> {
    return Promise.resolve([]);
  }
}
