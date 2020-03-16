import { MonitoredExperimentPoint } from '../../../src/api/models/MonitoredExperimentPoint';
import { Container } from 'typedi';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { CheckService } from '../../../src/api/services/CheckService';

export function checkExperimentAssignedIsDefault(
  experimentConditionAssignments: any,
  experimentName: string,
  experimentPoint: string
): void {
  expect(experimentConditionAssignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentName,
        point: experimentPoint,
        assignedCondition: { conditionCode: 'default' },
      }),
    ])
  );
}

export function checkExperimentAssignedIsNotDefault(
  experimentConditionAssignments: any,
  experimentName: string,
  experimentPoint: string
): void {
  // get object with name and point
  const experimentObject = experimentConditionAssignments.find(experiment => {
    return experiment.name === experimentName && experiment.point === experimentPoint;
  });
  expect(experimentObject.assignedCondition.conditionCode).not.toEqual('default');
}

export function checkMarkExperimentPointForUser(
  markedExperimentPoint: MonitoredExperimentPoint[],
  userId: string,
  experimentName: string,
  experimentPoint: string
): void {
  expect(markedExperimentPoint).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experimentName ? `${experimentName}_${experimentPoint}` : experimentPoint,
        userId,
      }),
    ])
  );
}

export async function getAllExperimentCondition(userId: string): Promise<any> {
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);

  // getAllExperimentConditions
  return experimentAssignmentService.getAllExperimentConditions(userId);
}

export async function markExperimentPoint(
  userId: string,
  experimentName: string,
  experimentPoint: string
): Promise<MonitoredExperimentPoint[]> {
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const checkService = Container.get<CheckService>(CheckService);

  // mark experiment point
  await experimentAssignmentService.markExperimentPoint(userId, experimentPoint, experimentName);
  return checkService.getAllMarkedExperimentPoints();
}
