import { Container } from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { Logger as WinstonLogger } from '../../../src/lib/logger';
import { getAllExperimentCondition } from '../utils';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { previewIndividualAssignmentExperiment } from '../mockData/experiment';
import { experimentUsers } from '../mockData/experimentUsers/index';

export default async function testCase(): Promise<void> {
  const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.create(systemUser as any);

  // experiment object
  const experimentObject = previewIndividualAssignmentExperiment;

  // create experiment
  await experimentService.create(experimentObject as any, user);
  const experiments = await experimentService.find();
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
  const experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  expect(experimentConditionAssignments).toHaveLength(0);
}
