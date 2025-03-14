import { Container } from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { groupLevelEnrollmentCodeExperiment } from '../../mockData/experiment/index';
import { getAllExperimentCondition, markExperimentPoint } from '../../utils';
import { checkMarkExperimentPointForUser, checkExperimentAssignedIsNull } from '../../utils/index';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { ENROLLMENT_CODE, EXCLUSION_CODE, EXPERIMENT_STATE } from 'upgrade_types';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { CheckService } from '../../../../src/api/services/CheckService';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const checkService = Container.get<CheckService>(CheckService);
  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = groupLevelEnrollmentCodeExperiment;

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  let experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: experimentObject.state,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  const experimentName = experimentObject.partitions[0].target;
  const experimentPoint = experimentObject.partitions[0].site;
  const condition = experimentObject.conditions[0].conditionCode;

  // get all experiment condition for user 1
  const experimentId = experiments[0].id;
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point for user 1
  let markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint, condition, experimentId, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    1
  );

  // change experiment status to Enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: EXPERIMENT_STATE.ENROLLING,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  // the user should be excluded due to 'REACHED_PRIOR' exclusion code:
  let individualAssignments = await checkService.getAllIndividualAssignment();
  expect(individualAssignments.length).toEqual(0);

  let individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(1);
  expect(individualExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experiments[0].id + "_" + experimentUsers[0].id,
        exclusionCode: EXCLUSION_CODE.REACHED_PRIOR
      })
    ])
  );

  const groupExclusions = await checkService.getAllGroupExclusions();
  expect(groupExclusions.length).toEqual(1);

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName, experimentPoint);

  // mark experiment point for user 2
  markedExperimentPoint = await markExperimentPoint(experimentUsers[1].id, experimentName, experimentPoint, condition, experimentId, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[1].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user 2 should be excluded as it has the same group as excluded user 1:
  individualAssignments = await checkService.getAllIndividualAssignment();
  expect(individualAssignments.length).toEqual(0);

  individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(2);
  expect(individualExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experiments[0].id + "_" + experimentUsers[1].id,
        exclusionCode: EXCLUSION_CODE.EXCLUDED_DUE_TO_GROUP_LOGIC
      })
    ])
  );

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());

  // mark experiment point for user 3
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName, experimentPoint, condition, experimentId, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[2].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user 3 should be enrolled with 'ALGORITHMIC' enrollment code & create a group enrollment document:
  individualAssignments = await checkService.getAllIndividualAssignment();
  expect(individualAssignments.length).toEqual(1);

  let groupAssignments = await checkService.getAllGroupAssignments();
  expect(groupAssignments.length).toEqual(1);

  expect(individualAssignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        user: expect.objectContaining({
          id: experimentUsers[2].id
        }),
        enrollmentCode: ENROLLMENT_CODE.ALGORITHMIC
      })
    ])
  );

  // update experiment state to ENROLLMENT_COMPLETE
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user, new UpgradeLogger());

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(2);

  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());

  // mark experiment point for user 3
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName, experimentPoint, condition, experimentId, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[2].id,
    experimentName,
    experimentPoint,
    2
  );

  // the user 3 should be already enrolled with 'ALGORITHMIC' enrollment code:
  individualAssignments = await checkService.getAllIndividualAssignment();
  expect(individualAssignments.length).toEqual(1);

  expect(individualAssignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        user: expect.objectContaining({
          id: experimentUsers[2].id
        }),
        enrollmentCode: ENROLLMENT_CODE.ALGORITHMIC
      })
    ])
  );

  // change back to ENROLLING
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: EXPERIMENT_STATE.ENROLLING,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  // check for experiment condition for user 4
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[3].id, new UpgradeLogger());

  // mark experiment point for user 4
  markedExperimentPoint = await markExperimentPoint(experimentUsers[3].id, experimentName, experimentPoint, condition, experimentId, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[3].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user 4 should be enrolled with 'ALGORITHMIC' enrollment code & create a group enrollment document:
  individualAssignments = await checkService.getAllIndividualAssignment();
  expect(individualAssignments.length).toEqual(2);

  groupAssignments = await checkService.getAllGroupAssignments();
  expect(groupAssignments.length).toEqual(1);

  expect(individualAssignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        user: expect.objectContaining({
          id: experimentUsers[3].id
        }),
        enrollmentCode: ENROLLMENT_CODE.GROUP_LOGIC
      })
    ])
  );
}
