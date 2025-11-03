import { Container } from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { ExperimentLevelExclusionExperiment } from '../../mockData/experiment/index';
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
  const experimentObject = ExperimentLevelExclusionExperiment;

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

  // // get all experiment condition for user 1
  const experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point for user 1
  const markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint, 1);

  // the user should be excluded due to 'PARTICIPANT_ON_EXCLUSION_LIST' exclusion code:
  const individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(1);
  expect(individualExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experiments[0].id + '_' + experimentUsers[0].id,
        exclusionCode: EXCLUSION_CODE.PARTICIPANT_ON_EXCLUSION_LIST,
      }),
    ])
  );
}
