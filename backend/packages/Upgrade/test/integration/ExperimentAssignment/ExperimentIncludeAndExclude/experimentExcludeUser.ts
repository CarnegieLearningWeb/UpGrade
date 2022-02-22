import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { getAllExperimentCondition } from '../../utils';
import { ExperimentExcludeService } from '../../../../src/api/services/ExperimentExcludeService';
import { FILTER_MODE } from '../../../../../../../types/src';

export default async function experimentExcludeUser(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const experimentExcludeService = Container.get<ExperimentExcludeService>(ExperimentExcludeService);

  // creating new user
  const userIn = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = individualAssignmentExperiment;
  const context = experimentObject.context[0];
  experimentObject.filterMode = FILTER_MODE.INCLUDE_ALL;

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

  let experimentCondition = await getAllExperimentCondition(user.id, new UpgradeLogger(), context);
  expect(experimentCondition.length).not.toEqual(0);

  // add user in experiment individual exclude
  const excludedUser = await experimentExcludeService.experimentExcludeUser([user.id], experimentId);
  expect(excludedUser).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        userId: user.id,
        experimentId: experimentId
      }),
    ])
  );

  // check if user is excluded for this experiment
  experimentCondition = await getAllExperimentCondition(user.id, new UpgradeLogger(), context);
  expect(experimentCondition.length).toEqual(0);
}
