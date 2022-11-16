import Container from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { aliasConditionExperiment } from '../../mockData/experiment/index';
import { getAllExperimentCondition, markExperimentPoint } from '../../utils';
import { checkMarkExperimentPointForUser, checkExperimentAssignedIsNotDefault } from '../../utils/index';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function EnrollmentWithConditionAlias(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject: any = aliasConditionExperiment;

  // remove 1 condition
  experimentObject.conditions.sort((a, b) => {
    return a.order > b.order ? 1 : a.order < b.order ? -1 : 0;
  });
  experimentObject.conditions.pop();

  const experimentName = experimentObject.partitions[0].target;
  const experimentPoint = experimentObject.partitions[0].site;
  const aliasCondition = experimentObject.conditionAliases[0].aliasName;

  // create experiment 1
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

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
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

  // get all experiment condition for user 1
  const experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);
  expect(experimentConditionAssignments).toHaveLength(3);
  expect(experimentConditionAssignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        assignedCondition: expect.objectContaining({ conditionCode: 'ConditionA_W1' }),
      }),
      expect.objectContaining({
        assignedCondition: expect.objectContaining({ conditionCode: 'ConditionA_W2' }),
      }),
      expect.objectContaining({
        assignedCondition: expect.objectContaining({ conditionCode: 'ConditionA' }),
      }),
    ])
  );

  // mark experiment point for user 1
  const markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    aliasCondition,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);
}
