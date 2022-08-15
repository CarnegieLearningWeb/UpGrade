import { MonitoredDecisionPoint } from '../../../src/api/models/MonitoredDecisionPoint';
import { Container } from 'typedi';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { CheckService } from '../../../src/api/services/CheckService';
import { INewExperimentAssignment, ENROLLMENT_CODE, MARKED_DECISION_POINT_STATUS } from 'upgrade_types';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { User } from '../../../src/api/models/User';
import { getRepository } from 'typeorm';
import { IndividualEnrollment } from '../../../src/api/models/IndividualEnrollment';
import { IndividualExclusion } from '../../../src/api/models/IndividualExclusion';
import { GroupEnrollment } from '../../../src/api/models/GroupEnrollment';
import { GroupExclusion } from './../../../src/api/models/GroupExclusion';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';

export function checkExperimentAssignedIsNull(
  experimentConditionAssignments: any,
  experimentName: string,
  experimentPoint: string
): void {
  expect(experimentConditionAssignments).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        expId: experimentName,
        expPoint: experimentPoint,
      }),
    ])
  );
}

export function checkExperimentAssignedIsNotDefault(
  experimentConditionAssignments: INewExperimentAssignment[],
  experimentName: string,
  experimentPoint: string
): void {
  // get object with name and point
  const experimentObject = experimentConditionAssignments.find((experiment) => {
    return experiment.target === experimentName && experiment.site === experimentPoint;
  });
  expect(experimentObject.assignedCondition.conditionCode).not.toEqual('default');
}

export function checkMarkExperimentPointForUser(
  markedDecisionPoint: MonitoredDecisionPoint[],
  userId: string,
  experimentName: string,
  experimentPoint: string,
  markExperimentPointLogLength?: number,
  enrollmentCode?: ENROLLMENT_CODE
): void {
  const experimentId = experimentName ? `${experimentName}_${experimentPoint}` : experimentPoint;
  if (!markExperimentPointLogLength) {
    expect(markedDecisionPoint).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: `${experimentId}_${userId}`,
          decisionPoint: experimentId,
          user: expect.objectContaining({
            id: userId,
          }),
        }),
      ])
    );
  } else {
    expect(markedDecisionPoint).toEqual(
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

    const monitorDocument = markedDecisionPoint.find((markedPoint) => {
      return markedPoint.id === `${experimentId}_${userId}` && experimentId === experimentId;
    });

    expect(monitorDocument.monitoredPointLogs.length).toEqual(markExperimentPointLogLength);
  }
}

export async function getAllExperimentCondition(
  userId: string,
  logger: UpgradeLogger,
  context: string = 'home'
): Promise<INewExperimentAssignment[]> {
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  // getOriginalUserDoc
  const experimentUserDoc = await experimentUserService.getOriginalUserDoc(userId, logger);
  // getAllExperimentConditions
  return experimentAssignmentService.getAllExperimentConditions(userId, context, {
    logger: logger,
    userDoc: experimentUserDoc,
  });
}

export async function markExperimentPoint(
  userId: string,
  experimentName: string,
  experimentPoint: string,
  condition: string | null,
  logger: UpgradeLogger
): Promise<MonitoredDecisionPoint[]> {
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  const checkService = Container.get<CheckService>(CheckService);
  // getOriginalUserDoc
  const experimentUserDoc = await experimentUserService.getOriginalUserDoc(userId, logger);
  // mark experiment point
  await experimentAssignmentService.markExperimentPoint(
    userId,
    experimentPoint,
    MARKED_DECISION_POINT_STATUS.APPLIED,
    condition,
    { logger, userDoc: experimentUserDoc },
    experimentName
  );
  return checkService.getAllMarkedExperimentPoints();
}

export async function checkDeletedExperiment(experimentId: string, user: User): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // delete experiment and check assignments operations
  await experimentService.delete(experimentId, user, new UpgradeLogger());

  // no individual assignments
  const individualEnrollmentRepository = getRepository(IndividualEnrollment);
  const individualAssignments = await individualEnrollmentRepository.find();
  expect(individualAssignments.length).toEqual(0);

  // no individual exclusion
  const individualExclusionRepository = getRepository(IndividualExclusion);
  const individualExclusions = await individualExclusionRepository.find();
  expect(individualExclusions.length).toEqual(0);

  // no group assignment
  const groupEnrollmentRepository = getRepository(GroupEnrollment);
  const groupAssignments = await groupEnrollmentRepository.find();
  expect(groupAssignments.length).toEqual(0);

  // no group exclusion
  const groupExclusionRepository = getRepository(GroupExclusion);
  const groupExclusions = await groupExclusionRepository.find();
  expect(groupExclusions.length).toEqual(0);
}
