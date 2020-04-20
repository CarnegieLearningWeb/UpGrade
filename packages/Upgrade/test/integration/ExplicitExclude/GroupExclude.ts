import { groupAssignmentWithGroupConsistencyExperiment } from '../mockData/experiment/index';
import { Container } from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { Logger as WinstonLogger } from '../../../src/lib/logger';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { ExcludeService } from '../../../src/api/services/ExcludeService';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { getAllExperimentCondition } from '../utils';

export default async function GroupExclude(): Promise<void> {
  const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const excludeService = Container.get<ExcludeService>(ExcludeService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const userIn = await userService.create(systemUser as any);

  // experiment object
  const experimentObject = groupAssignmentWithGroupConsistencyExperiment;

  // create experiment
  await experimentService.create(experimentObject as any, userIn);
  let experiments = await experimentService.find();
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
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, userIn);

  // fetch experiment
  experiments = await experimentService.find();
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

  const groupType: string = Object.keys(user.group)[0];
  const groupId: string = user.group[groupType].toString();

  let experimentCondition = await getAllExperimentCondition(user.id);
  expect(experimentCondition.length).not.toEqual(0);

  // add user in group exclude
  const excludedGroup = await excludeService.excludeGroup(groupId, groupType);
  expect(excludedGroup).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        groupId,
        type: groupType,
      }),
    ])
  );

  experimentCondition = await getAllExperimentCondition(user.id);
  expect(experimentCondition.length).toEqual(0);
}
