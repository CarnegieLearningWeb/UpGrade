import { Container } from 'typedi';
import { individualAssignmentExperiment } from '../mockData/experiment';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { UserService } from '../../../src/api/services/UserService';
import { Logger as WinstonLogger } from '../../../src/lib/logger';
import { systemUser } from '../mockData/user/index';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { ExperimentUserService } from '../../../src/api/services/ExperimentUserService';

export default async function testCase(): Promise<void> {
  const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);

  // creating new user
  const user = await userService.create(systemUser as any);

  // experiment object
  const experimentObject = individualAssignmentExperiment;

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

  let experimentUser = await experimentUserService.find();
  expect(experimentUser.length).toEqual(0);

  // get all experiment condition for user 1
  const experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  expect(experimentConditionAssignments).toHaveLength(0);

  experimentUser = await experimentUserService.find();
  expect(experimentUser.length).toEqual(1);
}
