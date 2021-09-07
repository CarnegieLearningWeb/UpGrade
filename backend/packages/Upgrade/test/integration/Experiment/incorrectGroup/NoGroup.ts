import { IndividualAssignment } from '../../../../src/api/models/IndividualAssignment';
import { getRepository } from 'typeorm';
import { ExperimentUserService } from '../../../../src/api/services/ExperimentUserService';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { Container } from 'typedi';
import {
  individualAssignmentExperiment,
  groupAssignmentWithIndividualConsistencyExperimentSecond,
  groupAssignmentWithIndividualConsistencyExperimentThird,
} from '../../mockData/experiment';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { checkExperimentAssignedIsNull, checkExperimentAssignedIsNotDefault, checkMarkExperimentPointForUser, getAllExperimentCondition, markExperimentPoint } from '../../utils';
import { Console } from 'winston/lib/winston/transports';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);
  const experimentUserService = Container.get<ExperimentUserService>(ExperimentUserService);
  const userService = Container.get<UserService>(UserService);
  const individualAssignmentRepository = getRepository(IndividualAssignment);

  // creating new user
  const user = await userService.upsertUser(systemUser as any);

  // create individual and group experiment
  const experimentObject1 = individualAssignmentExperiment;
  const experimentName1 = experimentObject1.partitions[0].expId;
  const experimentPoint1 = experimentObject1.partitions[0].expPoint;
  // const condition1 = experimentObject1.conditions[0].conditionCode;
  await experimentService.create(experimentObject1 as any, user);

  const experimentObject2 = groupAssignmentWithIndividualConsistencyExperimentSecond;
  const experimentName2 = experimentObject2.partitions[0].expId;
  const experimentPoint2 = experimentObject2.partitions[0].expPoint;
  // const condition2 = experimentObject2.conditions[0].conditionCode;
  await experimentService.create(experimentObject2 as any, user);

  let experiments = await experimentService.find();
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject1.name,
        state: experimentObject1.state,
        postExperimentRule: experimentObject1.postExperimentRule,
        assignmentUnit: experimentObject1.assignmentUnit,
        consistencyRule: experimentObject1.consistencyRule,
      }),
      expect.objectContaining({
        name: experimentObject2.name,
        state: experimentObject2.state,
        postExperimentRule: experimentObject2.postExperimentRule,
        assignmentUnit: experimentObject2.assignmentUnit,
        consistencyRule: experimentObject2.consistencyRule,
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
      }),
      expect.objectContaining({
        name: experimentObject2.name,
        state: EXPERIMENT_STATE.ENROLLING,
        postExperimentRule: experimentObject2.postExperimentRule,
        assignmentUnit: experimentObject2.assignmentUnit,
        consistencyRule: experimentObject2.consistencyRule,
      }),
    ])
  );

  // call get all experiment condition
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);

  // check the experiment assignment
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);

  // create new group experiment
  const experimentObject3 = groupAssignmentWithIndividualConsistencyExperimentThird;
  const experimentName3 = experimentObject3.partitions[0].expId;
  const experimentPoint3 = experimentObject3.partitions[0].expPoint;
  await experimentService.create(experimentObject3 as any, user);

  experiments = await experimentService.find();
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject3.name,
        state: experimentObject3.state,
        postExperimentRule: experimentObject3.postExperimentRule,
        assignmentUnit: experimentObject3.assignmentUnit,
        consistencyRule: experimentObject3.consistencyRule,
      }),
    ])
  );

  await experimentService.updateState(experimentObject3.id, EXPERIMENT_STATE.ENROLLING, user);
  experiments = await experimentService.find();
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject3.name,
        state: EXPERIMENT_STATE.ENROLLING,
        postExperimentRule: experimentObject3.postExperimentRule,
        assignmentUnit: experimentObject3.assignmentUnit,
        consistencyRule: experimentObject3.consistencyRule,
      })
    ])
  );

  // remove user group
  await experimentUserService.updateGroupMembership(experimentUsers[0].id, null);
  const experimentUser = await experimentUserService.findOne(experimentUsers[0].id);
  expect(experimentUser.group).toBeNull();

  // call getAllExperiment
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);

  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName1, experimentPoint1);
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName2, experimentPoint2);
  checkExperimentAssignedIsNull(experimentConditionAssignments, experimentName3, experimentPoint3);
}
