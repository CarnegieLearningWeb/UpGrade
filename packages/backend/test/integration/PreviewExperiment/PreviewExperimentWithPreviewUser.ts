import { Container } from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { getAllExperimentCondition } from '../utils';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { previewIndividualAssignmentExperiment } from '../mockData/experiment';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { previewUsers } from '../mockData/previewUsers/index';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const previewService = Container.get<PreviewUserService>(PreviewUserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // creating preview user
  const previewUser = await previewService.create(previewUsers[0], new UpgradeLogger());

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

  // get all experiment condition for preview user
  const experimentConditionAssignments = await getAllExperimentCondition(previewUser.id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(experimentObject.partitions.length);

  // // get all experiment for non preview user
  // experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  // expect(experimentConditionAssignments).toHaveLength(0);
}
