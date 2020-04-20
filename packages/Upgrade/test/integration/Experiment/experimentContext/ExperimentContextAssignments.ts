import { Container } from 'typedi';
import { individualAssignmentExperiment, secondExperiment } from '../../mockData/experiment';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { getAllExperimentCondition } from '../../utils';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { getRepository } from 'typeorm';
import { IndividualAssignment } from '../../../../src/api/models/IndividualAssignment';

export default async function testCase(): Promise<void> {
  const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);

  // get repository
  const individualAssignmentRepository = getRepository(IndividualAssignment);

  // creating new user
  const user = await userService.create(systemUser as any);
  const context1 = 'login';
  const context2 = 'about';

  // experiment object
  const experimentObject1 = individualAssignmentExperiment;
  experimentObject1.context = [context1];

  // create experiment 1
  await experimentService.create(experimentObject1 as any, user);
  let experiments = await experimentService.find();
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject1.name,
        state: experimentObject1.state,
        postExperimentRule: experimentObject1.postExperimentRule,
        assignmentUnit: experimentObject1.assignmentUnit,
        consistencyRule: experimentObject1.consistencyRule,
        context: [context1],
      }),
    ])
  );

  const experimentObject2 = secondExperiment;
  experimentObject2.context = [context2];
  // create experiment 2
  await experimentService.create(experimentObject2 as any, user);
  experiments = await experimentService.find();
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject2.name,
        state: experimentObject2.state,
        postExperimentRule: experimentObject2.postExperimentRule,
        assignmentUnit: experimentObject2.assignmentUnit,
        consistencyRule: experimentObject2.consistencyRule,
        context: [context2],
      }),
    ])
  );

  // change experiment status to Enrolling
  const [experiment1, experiment2] = experiments;
  await experimentService.updateState(experiment1.id, EXPERIMENT_STATE.ENROLLING, user);
  await experimentService.updateState(experiment2.id, EXPERIMENT_STATE.ENROLLING, user);

  // fetch experiment
  experiments = await experimentService.find();
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject1.name,
        state: EXPERIMENT_STATE.ENROLLING,
        postExperimentRule: experimentObject1.postExperimentRule,
        assignmentUnit: experimentObject1.assignmentUnit,
        consistencyRule: experimentObject1.consistencyRule,
        context: [context1],
      }),
      expect.objectContaining({
        name: experimentObject2.name,
        state: EXPERIMENT_STATE.ENROLLING,
        postExperimentRule: experimentObject2.postExperimentRule,
        assignmentUnit: experimentObject2.assignmentUnit,
        consistencyRule: experimentObject2.consistencyRule,
        context: [context2],
      }),
    ])
  );

  let allIndividualAssignments = await individualAssignmentRepository.find();
  expect(allIndividualAssignments.length).toEqual(0);

  // get experiment with context1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, context1);
  expect(experimentConditionAssignments.length).toEqual(experimentObject1.partitions.length);

  // check that no assignment of context 2 is assigned
  allIndividualAssignments = await individualAssignmentRepository.find();
  expect(allIndividualAssignments.length).toEqual(1);

  // get experiment with context2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, context2);
  expect(experimentConditionAssignments.length).toEqual(experimentObject2.partitions.length);

  // check that no assignment of context 2 is assigned
  allIndividualAssignments = await individualAssignmentRepository.find();
  expect(allIndividualAssignments.length).toEqual(2);

  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id);
  expect(experimentConditionAssignments.length).toEqual(0);
}
