import { MonitoredExperimentPoint } from '../../../src/api/models/MonitoredExperimentPoint';
import { Container } from 'typedi';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { CheckService } from '../../../src/api/services/CheckService';
import { IExperimentAssignment } from 'ees_types';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { User } from '../../../src/api/models/User';
import { getRepository } from 'typeorm';
import { IndividualAssignment } from '../../../src/api/models/IndividualAssignment';
import { IndividualExclusion } from '../../../src/api/models/IndividualExclusion';
import { GroupAssignment } from '../../../src/api/models/GroupAssignment';

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
  const experimentObject = experimentConditionAssignments.find((experiment) => {
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
  const experimentId = experimentName ? `${experimentName}_${experimentPoint}` : experimentPoint;
  expect(markedExperimentPoint).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: `${experimentId}_${userId}`,
        experimentId,
        user: expect.objectContaining({
          id: userId,
        }),
      }),
    ])
  );
}

export async function getAllExperimentCondition(
  userId: string,
  context?: string | undefined
): Promise<IExperimentAssignment[]> {
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);

  // getAllExperimentConditions
  return experimentAssignmentService.getAllExperimentConditions(userId, context);
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

export async function checkDeletedExperiment(experimentId: string, user: User): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // delete experiment and check assignments operations
  await experimentService.delete(experimentId, user);

  // no individual assignments
  const individualAssignmentRepository = getRepository(IndividualAssignment);
  const individualAssignments = await individualAssignmentRepository.find();
  expect(individualAssignments.length).toEqual(0);

  // no individual exclusion
  const individualExclusionRepository = getRepository(IndividualExclusion);
  const individualExclusions = await individualExclusionRepository.find();
  expect(individualExclusions.length).toEqual(0);

  // no group assignment
  const groupAssignmentRepository = getRepository(GroupAssignment);
  const groupAssignments = await groupAssignmentRepository.find();
  expect(groupAssignments.length).toEqual(0);

  // no group exclusion
  const groupExclusionRepository = getRepository(GroupAssignment);
  const groupExclusions = await groupExclusionRepository.find();
  expect(groupExclusions.length).toEqual(0);

  // no monitored experiment point
  const monitoredExperimentPointRepository = getRepository(MonitoredExperimentPoint);
  const monitoredExperimentPoint = await monitoredExperimentPointRepository.find();
  expect(monitoredExperimentPoint.length).toEqual(0);
}
