import { MonitoredExperimentPoint } from '../../../src/api/models/MonitoredExperimentPoint';
import { User } from '../../../src/api/models/User';
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
        id: experimentName,
        point: experimentPoint,
        assignedCondition: 'default',
      }),
    ])
  );
}

export function checkExperimentAssignedIsNotDefault(
  experimentConditionAssignments: any,
  experimentName: string,
  experimentPoint: string
): void {
  expect(experimentConditionAssignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experimentName,
        point: experimentPoint,
      }),
      expect.not.objectContaining({
        id: experimentName,
        point: experimentPoint,
        assignedCondition: 'default',
      }),
    ])
  );
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
        experimentId: experimentName,
        experimentPoint,
        userId,
      }),
    ])
  );
}

export async function getAllExperimentCondition(user: Partial<User>): Promise<any> {
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  // getAllExperimentCondition and MarkExperimentPoint before experiment creation
  const { id, group } = user;

  // getAllExperimentConditions
  return experimentAssignmentService.getAllExperimentConditions(id, group);
}

export async function markExperimentPoint(
  user: Partial<User>,
  experimentName: string,
  experimentPoint: string
): Promise<MonitoredExperimentPoint[]> {
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const checkService = Container.get<CheckService>(CheckService);

  const { id, group } = user;
  // mark experiment point
  await experimentAssignmentService.markExperimentPoint(experimentName, experimentPoint, id, group);
  return checkService.getAllMarkedExperimentPoints();
}
