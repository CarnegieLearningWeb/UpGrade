import { Container } from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { getAllExperimentCondition } from '../utils';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { previewIndividualAssignmentExperiment } from '../mockData/experiment';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = previewIndividualAssignmentExperiment;

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

  // get all experiment condition for user 1
  const experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);
}
