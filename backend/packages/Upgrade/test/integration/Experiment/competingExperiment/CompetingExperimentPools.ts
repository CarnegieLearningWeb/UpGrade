import { Container } from 'typedi';
import {
  competingExperimentAssignmentExperiment1,
  competingExperimentAssignmentExperiment2,
  competingExperimentAssignmentExperiment3,
} from '../../mockData/experiment';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { getAllExperimentCondition, markExperimentPoint } from '../../utils';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { checkMarkExperimentPointForUser, checkExperimentAssignedIsNull } from '../../utils/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function CompetingExperiment(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject1 = competingExperimentAssignmentExperiment1;

  // create experiment
  await experimentService.create(experimentObject1 as any, user, new UpgradeLogger());
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
    ])
  );

  const target = experimentObject1.partitions[0].target;
  const site = experimentObject1.partitions[0].site;
  const condition = experimentObject1.conditions[0].conditionCode;

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

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
    ])
  );

  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(2);
  checkExperimentAssignedIsNull(experimentConditionAssignments, target, site);

  // experiment 2 object
  const experimentObject2 = competingExperimentAssignmentExperiment2;

  // create experiment
  await experimentService.create(experimentObject2 as any, user, new UpgradeLogger());
  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject2.name,
        state: experimentObject2.state,
        postExperimentRule: experimentObject2.postExperimentRule,
        assignmentUnit: experimentObject2.assignmentUnit,
        consistencyRule: experimentObject2.consistencyRule,
      }),
    ])
  );

  // get all experiment condition for user 1 will return 2 pools with 2 exps with 2 DP's each
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(4);

  // experiment 3 object which should merge the two pools of exp1 and exp2 with exp3
  const experimentObject3 = competingExperimentAssignmentExperiment3;

  // create experiment
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

  // get all experiment condition for user 1 should return only one exp from the pool of exp1-2-3
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(2);

  // mark experiment point for user 4
  const markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    target,
    site,
    condition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, target, site, 1);
}
