import { Container } from 'typedi';
import { individualAssignmentExperiment } from '../mockData/experiment';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { getAllExperimentCondition } from '../utils';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = individualAssignmentExperiment;

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());
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

  let experimentUser = await experimentUserService.find(new UpgradeLogger());
  expect(experimentUser.length).toEqual(0);

  // get all experiment condition for user 1
  await expect(getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger())).rejects.toThrow();

  experimentUser = await experimentUserService.find(new UpgradeLogger());
  expect(experimentUser.length).toEqual(0);
}
