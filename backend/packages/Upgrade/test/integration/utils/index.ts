import { GroupExclusionRepository } from './../../../src/api/repositories/GroupExclusionRepository';
import { GroupEnrollmentRepository } from './../../../src/api/repositories/GroupEnrollmentRepository';
import { IndividualEnrollmentRepository } from './../../../src/api/repositories/IndividualEnrollmentRepository';
import { Container as tteContainer } from './../../../src/typeorm-typedi-extensions/Container';
import { MonitoredDecisionPoint } from '../../../src/api/models/MonitoredDecisionPoint';
import { Container } from 'typedi';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { CheckService } from '../../../src/api/services/CheckService';
import { IExperimentAssignmentv5, MARKED_DECISION_POINT_STATUS } from 'upgrade_types';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { User } from '../../../src/api/models/User';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { DecisionPoint } from 'src/api/models/DecisionPoint';

export function updateExcludeIfReachedFlag(
  partitions: Array<
    Partial<Omit<DecisionPoint, 'createdAt' | 'updatedAt' | 'versionNumber' | 'experiment' | 'conditionPayloads'>>
  >
): DecisionPoint[] {
  partitions.forEach((partition) => {
    partition.excludeIfReached = true;
  });
  return partitions as DecisionPoint[];
}
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';

export function checkExperimentAssignedIsNull(experimentConditionAssignments: any, target: string, site: string): void {
  expect(experimentConditionAssignments).not.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        target: target,
        site: site,
      }),
    ])
  );
}

export function checkExperimentAssignedIsNotDefault(
  experimentConditionAssignments: IExperimentAssignmentv5[],
  target: string,
  site: string
): void {
  // get object with target and site
  const experimentObject = experimentConditionAssignments.find((experiment) => {
    return experiment.target === target && experiment.site === site;
  });
  expect(experimentObject.assignedCondition[0].conditionCode).not.toEqual('default');
}

export function checkMarkExperimentPointForUser(
  markedDecisionPoint: MonitoredDecisionPoint[],
  userId: string,
  target: string,
  site: string,
  markExperimentPointLogLength?: number
): void {
  if (!markExperimentPointLogLength) {
    expect(markedDecisionPoint).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          site: site,
          target: target,
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
          site: site,
          user: expect.objectContaining({
            id: userId,
          }),
        }),
      ])
    );
  }
}

export async function getAllExperimentCondition(
  userId: string,
  logger: UpgradeLogger,
  context = 'home'
): Promise<IExperimentAssignmentv5[]> {
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  // getOriginalUserDoc
  const experimentUserDoc = await experimentUserService.getOriginalUserDoc(userId, logger);
  // getAllExperimentConditions
  return experimentAssignmentService.getAllExperimentConditions(
    { ...experimentUserDoc, requestedUserId: userId },
    context,
    logger
  );
}

export async function markExperimentPoint(
  userId: string,
  target: string,
  site: string,
  condition: string | null,
  experimentId: string,
  logger: UpgradeLogger,
  uniquifier?: string
): Promise<MonitoredDecisionPoint[]> {
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  const checkService = Container.get<CheckService>(CheckService);
  // getOriginalUserDoc
  const experimentUserDoc = await experimentUserService.getOriginalUserDoc(userId, logger);
  // mark experiment point
  await experimentAssignmentService.markExperimentPoint(
    { ...experimentUserDoc, requestedUserId: userId },
    site,
    MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
    condition,
    logger,
    experimentId,
    target,
    uniquifier
  );
  return checkService.getAllMarkedExperimentPoints();
}

export async function checkDeletedExperiment(experimentId: string, user: User): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // delete experiment and check assignments operations
  await experimentService.delete(experimentId, user, { logger: new UpgradeLogger() });

  // no individual assignments
  const individualEnrollmentRepository = tteContainer.getCustomRepository(IndividualEnrollmentRepository);
  const individualAssignments = await individualEnrollmentRepository.find();
  expect(individualAssignments.length).toEqual(0);

  // no individual exclusion
  const individualExclusionRepository = tteContainer.getCustomRepository(IndividualExclusionRepository);
  const individualExclusions = await individualExclusionRepository.find();
  expect(individualExclusions.length).toEqual(0);

  // no group assignment
  const groupEnrollmentRepository = tteContainer.getCustomRepository(GroupEnrollmentRepository);
  const groupAssignments = await groupEnrollmentRepository.find();
  expect(groupAssignments.length).toEqual(0);

  // no group exclusion
  const groupExclusionRepository = tteContainer.getCustomRepository(GroupExclusionRepository);
  const groupExclusions = await groupExclusionRepository.find();
  expect(groupExclusions.length).toEqual(0);
}
