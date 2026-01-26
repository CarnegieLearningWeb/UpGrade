import { IndividualEnrollmentRepository } from './../../../../src/api/repositories/IndividualEnrollmentRepository';
import { Container as tteContainer } from './../../../../src/typeorm-typedi-extensions';
import { Container } from 'typedi';
import { individualAssignmentExperiment, secondExperiment } from '../../mockData/experiment';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { getAllExperimentCondition, markExperimentPoint, checkMarkExperimentPointForUser } from '../../utils';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);

  // get repository
  const individualEnrollmentRepository = tteContainer.getCustomRepository(IndividualEnrollmentRepository);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());
  const context1 = 'sub';
  const context2 = 'add';

  // experiment object
  const experimentObject1 = structuredClone(individualAssignmentExperiment);
  experimentObject1.context = [context1];

  // create experiment 1
  await experimentService.create(experimentObject1 as any, user, new UpgradeLogger());
  let experiments = await experimentService.find(new UpgradeLogger());
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

  const firstExperiment = experiments[0];
  const experimentName1 = firstExperiment.partitions[0].target;
  const experimentPoint1 = firstExperiment.partitions[0].site;
  const condition1 = firstExperiment.conditions[0].conditionCode;

  const experimentObject2 = structuredClone(secondExperiment);
  experimentObject2.context = [context2];

  // create experiment 2
  await experimentService.create(experimentObject2 as any, user, new UpgradeLogger());
  experiments = await experimentService.find(new UpgradeLogger());
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

  const secondExperimentCreated = experiments.find((exp) => exp.id !== firstExperiment.id)!;
  const experimentName2 = secondExperimentCreated.partitions[0].target;
  const experimentPoint2 = secondExperimentCreated.partitions[0].site;
  const condition2 = secondExperimentCreated.conditions[0].conditionCode;
  // change experiment status to Enrolling
  await experimentService.updateState(firstExperiment.id, EXPERIMENT_STATE.RUNNING, user, new UpgradeLogger());
  await experimentService.updateState(secondExperimentCreated.id, EXPERIMENT_STATE.RUNNING, user, new UpgradeLogger());

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject1.name,
        state: EXPERIMENT_STATE.RUNNING,
        postExperimentRule: experimentObject1.postExperimentRule,
        assignmentUnit: experimentObject1.assignmentUnit,
        consistencyRule: experimentObject1.consistencyRule,
        context: [context1],
      }),
      expect.objectContaining({
        name: experimentObject2.name,
        state: EXPERIMENT_STATE.RUNNING,
        postExperimentRule: experimentObject2.postExperimentRule,
        assignmentUnit: experimentObject2.assignmentUnit,
        consistencyRule: experimentObject2.consistencyRule,
        context: [context2],
      }),
    ])
  );

  let allIndividualAssignments = await individualEnrollmentRepository.find();
  expect(allIndividualAssignments.length).toEqual(0);

  // get experiment with context1
  let experimentConditionAssignments = await getAllExperimentCondition(
    experimentUsers[1].id,
    new UpgradeLogger(),
    context1
  );
  expect(experimentConditionAssignments.length).toEqual(experimentObject1.partitions.length);

  let markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName1,
    experimentPoint1,
    condition1,
    firstExperiment.id,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName1, experimentPoint1);

  // check that no assignment of context 2 is assigned
  allIndividualAssignments = await individualEnrollmentRepository.find();
  expect(allIndividualAssignments.length).toEqual(1);

  // get experiment with context2
  experimentConditionAssignments = await getAllExperimentCondition(
    experimentUsers[1].id,
    new UpgradeLogger(),
    context2
  );
  expect(experimentConditionAssignments.length).toEqual(experimentObject2.partitions.length);

  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName2,
    experimentPoint2,
    condition2,
    secondExperimentCreated.id,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName2, experimentPoint2);

  // check that no assignment of context 2 is assigned
  allIndividualAssignments = await individualEnrollmentRepository.find();
  expect(allIndividualAssignments.length).toEqual(2);

  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger());
  expect(experimentConditionAssignments.length).toEqual(0);
}
