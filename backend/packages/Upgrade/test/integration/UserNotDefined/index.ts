import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';
import Container from 'typedi';
import { ExperimentAssignmentService } from '../../../src/api/services/ExperimentAssignmentService';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { experimentUsers } from '../mockData/experimentUsers/index';

export const UserNotDefined = async () => {
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const experimentUserDoc = await experimentUserService.getOriginalUserDoc(experimentUsers[0].id, new UpgradeLogger());
  await expect(
    experimentAssignmentService.getAllExperimentConditions(experimentUsers[0].id, null, {
      logger: new UpgradeLogger(),
      userDoc: experimentUserDoc,
    })
  ).rejects.toThrow();

  await expect(
    experimentAssignmentService.blobDataLog(experimentUsers[0].id, null, new UpgradeLogger())
  ).rejects.toThrow();

  await expect(
    experimentAssignmentService.dataLog(experimentUsers[0].id, null, {
      logger: new UpgradeLogger(),
      userDoc: experimentUserDoc,
    })
  ).rejects.toThrow();

  await expect(
    experimentAssignmentService.clientFailedExperimentPoint(null, null, experimentUsers[0].id, null, {
      logger: new UpgradeLogger(),
      userDoc: experimentUserDoc,
    })
  ).rejects.toThrow();

  await expect(
    experimentAssignmentService.markExperimentPoint(
      experimentUsers[0].id,
      null,
      MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
      null,
      { logger: new UpgradeLogger(), userDoc: experimentUserDoc },
      null
    )
  ).rejects.toThrow();

  await expect(
    experimentUserService.setAliasesForUser(experimentUsers[0].id, null, {
      logger: new UpgradeLogger(),
      userDoc: experimentUserDoc,
    })
  ).rejects.toThrow();

  await expect(
    experimentUserService.updateGroupMembership(experimentUsers[0].id, null, {
      logger: new UpgradeLogger(),
      userDoc: experimentUserDoc,
    })
  ).rejects.toThrow();

  await expect(
    experimentUserService.updateWorkingGroup(experimentUsers[0].id, null, {
      logger: new UpgradeLogger(),
      userDoc: experimentUserDoc,
    })
  ).rejects.toThrow();
};
