import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { getAllExperimentCondition } from '../../utils';
import { ExperimentIncludeService } from '../../../../src/api/services/ExperimentIncludeService';
import { FILTER_MODE } from '../../../../../../../types/src';

export default async function experimentIncludeUser(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const experimentIncludeService = Container.get<ExperimentIncludeService>(ExperimentIncludeService);

  // creating new user
  const userIn = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = individualAssignmentExperiment;
	experimentObject.filterMode = FILTER_MODE.EXCLUDE_ALL;

  // create experiment
  await experimentService.create(individualAssignmentExperiment as any, userIn, new UpgradeLogger());
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
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, userIn, new UpgradeLogger());

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

  // store individual user over here
  const user = experimentUsers[0];

  let experimentCondition = await getAllExperimentCondition(user.id, new UpgradeLogger());
  expect(experimentCondition.length).toEqual(0);

  // add user in experiment individual include
  const excludedUser = await experimentIncludeService.experimentIncludeUser([user.id], experimentId);
  expect(excludedUser).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        userId: user.id,
        experimentId: experimentId
      }),
    ])
  );

  // check if user is included for this experiment
  experimentCondition = await getAllExperimentCondition(user.id, new UpgradeLogger());
  expect(experimentCondition.length).not.toEqual(0);
}
