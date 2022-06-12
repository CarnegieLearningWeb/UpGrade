import { ExperimentUserService } from '../../../../src/api/services/ExperimentUserService';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { Container } from 'typedi';
import {
  individualAssignmentExperiment,
  groupAssignmentWithIndividualConsistencyExperimentSecond,
  groupAssignmentWithIndividualConsistencyExperimentThird,
} from '../../mockData/experiment';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import {
  checkExperimentAssignedIsNull,
  checkExperimentAssignedIsNotDefault,
  checkMarkExperimentPointForUser,
  getAllExperimentCondition,
  markExperimentPoint,
} from '../../utils';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { ExperimentClientController } from '../../../../src/api/controllers/ExperimentClientController';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  const experimentClientController = Container.get<ExperimentClientController>(ExperimentClientController);
  const userService = Container.get<UserService>(UserService);
  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create individual and group experiment
  const experimentObject1 = individualAssignmentExperiment;
  const experimentName1 = experimentObject1.partitions[0].target;
  const experimentPoint1 = experimentObject1.partitions[0].site;
  // const condition1 = experimentObject1.conditions[0].conditionCode;
  await experimentService.create(experimentObject1 as any, user, new UpgradeLogger());

  const experimentObject2 = groupAssignmentWithIndividualConsistencyExperimentSecond;
  const experimentName2 = experimentObject2.partitions[0].target;
  const experimentPoint2 = experimentObject2.partitions[0].site;
  const condition = experimentObject2.conditions[0].conditionCode;
  await experimentService.create(experimentObject2 as any, user, new UpgradeLogger());

  let experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject1.name,
        state: experimentObject1.state,
        postExperimentRule: experimentObject1.postExperimentRule,
        assignmentUnit: experimentObject1.assignmentUnit,
        consistencyRule: experimentObject1.consistencyRule,
      }),
      expect.objectContaining({
        name: experimentObject2.name,
        state: experimentObject2.state,
        postExperimentRule: experimentObject2.postExperimentRule,
        assignmentUnit: experimentObject2.assignmentUnit,
        consistencyRule: experimentObject2.consistencyRule,
      }),
    ])
  );

  // change experiment status to Enrolling
  const [experiment1, experiment2] = experiments;
  await experimentService.updateState(experiment1.id, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());
  await experimentService.updateState(experiment2.id, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject1.name,
        state: EXPERIMENT_STATE.ENROLLING,
        postExperimentRule: experimentObject1.postExperimentRule,
        assignmentUnit: experimentObject1.assignmentUnit,
        consistencyRule: experimentObject1.consistencyRule,
      }),
      expect.objectContaining({
        name: experimentObject2.name,
        state: EXPERIMENT_STATE.ENROLLING,
        postExperimentRule: experimentObject2.postExperimentRule,
        assignmentUnit: experimentObject2.assignmentUnit,
        consistencyRule: experimentObject2.consistencyRule,
      }),
    ])
  );

  // call get all experiment condition
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());

  // check the experiment assignment
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // mark experiment2
  const markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName2,
    experimentPoint2,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName2, experimentPoint2);

  // create new group experiment
  const experimentObject3 = groupAssignmentWithIndividualConsistencyExperimentThird;
  const experimentName3 = experimentObject3.partitions[0].target;
  const experimentPoint3 = experimentObject3.partitions[0].site;
  await experimentService.create(experimentObject3 as any, user, new UpgradeLogger());

  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject3.name,
        state: experimentObject3.state,
        postExperimentRule: experimentObject3.postExperimentRule,
        assignmentUnit: experimentObject3.assignmentUnit,
        consistencyRule: experimentObject3.consistencyRule,
      }),
    ])
  );

  await experimentService.updateState(experimentObject3.id, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());
  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject3.name,
        state: EXPERIMENT_STATE.ENROLLING,
        postExperimentRule: experimentObject3.postExperimentRule,
        assignmentUnit: experimentObject3.assignmentUnit,
        consistencyRule: experimentObject3.consistencyRule,
      }),
    ])
  );
  // getOriginalUserDoc call for alias
  const experimentUserDoc = await experimentClientController.getUserDoc(experimentUsers[0].id, new UpgradeLogger());
  // remove user group
  await experimentUserService.updateGroupMembership(experimentUsers[0].id, null, {
    logger: new UpgradeLogger(),
    userDoc: experimentUserDoc,
  });
  const experimentUser = await experimentUserService.findOne(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentUser.group).toBeNull();

  // call getAllExperiment
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());

  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName3, experimentPoint3);
}
