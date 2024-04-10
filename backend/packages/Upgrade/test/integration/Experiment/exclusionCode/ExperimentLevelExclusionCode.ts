import { Container } from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { ExperimentLevelExclusionExperiment, ExperimentLevelExclusionExperiment2 } from '../../mockData/experiment/index';
import { getAllExperimentCondition, markExperimentPoint } from '../../utils';
import { checkMarkExperimentPointForUser } from '../../utils/index';
import { CheckService } from '../../../../src/api/services/CheckService';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { EXCLUSION_CODE, EXPERIMENT_STATE } from 'upgrade_types';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const checkService = Container.get<CheckService>(CheckService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  let experimentObject = ExperimentLevelExclusionExperiment;

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

  let experimentName = experimentObject.partitions[0].target;
  let experimentPoint = experimentObject.partitions[0].site;
  let condition = experimentObject.conditions[0].conditionCode;

  // change experiment status to Enrolling
  let experimentId = experiments[0].id;
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

  // // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point for user 1
  let markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user should be excluded due to 'PARTICIPANT_ON_EXCLUSION_LIST' exclusion code:
  let individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(1);
  expect(individualExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        exclusionCode: EXCLUSION_CODE.PARTICIPANT_ON_EXCLUSION_LIST
      })
    ])
  );

  // delete the experiment
  await experimentService.delete(experimentId, user, new UpgradeLogger());
  
  // group experiment object
  experimentObject = ExperimentLevelExclusionExperiment2;

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  experiments = await experimentService.find(new UpgradeLogger());
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

  experimentName = experimentObject.partitions[0].target;
  experimentPoint = experimentObject.partitions[0].site;
  condition = experimentObject.conditions[0].conditionCode;

  // change experiment status to Enrolling
  experimentId = experiments[0].id;
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
  
  // get all experiment condition for user 3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());

  // mark experiment point for user 3
  markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[2].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user should be excluded due to 'GROUP_ON_EXCLUSION_LIST' exclusion code:
  let groupExclusions = await checkService.getAllGroupExclusions();
  expect(groupExclusions.length).toEqual(1);
  expect(groupExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        exclusionCode: EXCLUSION_CODE.GROUP_ON_EXCLUSION_LIST
      })
    ])
  );

}
