import { individualAssignmentExperiment } from '../mockData/experiment/index';
import { Container } from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
// import { Logger as WinstonLogger } from '../../../src/lib/logger';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { ExcludeService } from '../../../src/api/services/ExcludeService';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { getAllExperimentCondition } from '../utils';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function IndividualExclude(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const excludeService = Container.get<ExcludeService>(ExcludeService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const userIn = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = individualAssignmentExperiment;

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
  expect(experimentCondition.length).not.toEqual(0);

  // add user in individual exclude
  const excludedUser = await excludeService.excludeUser([user.id]);
  expect(excludedUser).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        userId: user.id,
      }),
    ])
  );

  experimentCondition = await getAllExperimentCondition(user.id, new UpgradeLogger());
  expect(experimentCondition.length).toEqual(0);
}
