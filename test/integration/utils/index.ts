import { MonitoredExperimentPoint } from '../../../src/api/models/MonitoredExperimentPoint';
import { ExperimentUser } from '../../../src/api/models/ExperimentUser';
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
        id: `${experimentName}_${experimentPoint}`,
        userId,
      }),
    ])
  );
}

export async function getAllExperimentCondition(user: Partial<ExperimentUser>): Promise<any> {
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  // getAllExperimentCondition and MarkExperimentPoint before experiment creation
  const { id, group } = user;

  // getAllExperimentConditions
  return experimentAssignmentService.getAllExperimentConditions(id, group);
}

export async function markExperimentPoint(
  user: Partial<ExperimentUser>,
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
