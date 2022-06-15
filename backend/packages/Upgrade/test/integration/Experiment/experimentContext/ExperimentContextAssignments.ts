import { Container } from 'typedi';
import { individualAssignmentExperiment, secondExperiment } from '../../mockData/experiment';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { getAllExperimentCondition, markExperimentPoint, checkMarkExperimentPointForUser } from '../../utils';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { getRepository } from 'typeorm';
import { IndividualEnrollment } from '../../../../src/api/models/IndividualEnrollment';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);

  // get repository
  const individualEnrollmentRepository = getRepository(IndividualEnrollment);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());
  const context1 = 'login';
  const context2 = 'about';

  // experiment object
  const experimentObject1 = individualAssignmentExperiment;
  experimentObject1.context = [context1];

  const experimentName1 = experimentObject1.partitions[0].target;
  const experimentPoint1 = experimentObject1.partitions[0].site;
  const condition1 = experimentObject1.conditions[0].conditionCode;

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

  const experimentObject2 = secondExperiment;
  experimentObject2.context = [context2];

  const experimentName2 = experimentObject2.partitions[0].target;
  const experimentPoint2 = experimentObject2.partitions[0].site;
  const condition2 = experimentObject2.conditions[0].conditionCode;
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

  // change experiment status to Enrolling
  const [experiment1, experiment2] = experiments;
  await experimentService.updateState(experiment1.id, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());
  await experimentService.updateState(experiment2.id, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
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
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName2, experimentPoint2);

  // check that no assignment of context 2 is assigned
  allIndividualAssignments = await individualEnrollmentRepository.find();
  expect(allIndividualAssignments.length).toEqual(2);

  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger());
  expect(experimentConditionAssignments.length).toEqual(0);
}
