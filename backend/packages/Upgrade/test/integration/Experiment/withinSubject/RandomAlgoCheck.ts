import { withinSubjectExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user';
import { experimentUsers } from '../../mockData/experimentUsers';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { getAllExperimentCondition } from '../../utils';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function RamdomAlgoCheck(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  const experimentObject = withinSubjectExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  const conditions = experimentObject.conditions;
  const context = experimentObject.context[0];

  // setting condition-2 weight as 100%
  conditions.sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));
  const updatedConditions = conditions.map((condition) => {
    return condition.order === 2 ? { ...condition, assignmentWeight: 100 } : { ...condition, assignmentWeight: 0 };
  });

  // create experiment
  await experimentService.create(
    { ...experimentObject, conditions: updatedConditions } as any,
    user,
    new UpgradeLogger()
  );
  let experiments = await experimentService.find(new UpgradeLogger());
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

  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
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

  // get all experiment condition for user 1
  const experimentConditionAssignments = await getAllExperimentCondition(
    experimentUsers[0].id,
    new UpgradeLogger(),
    context
  );
  expect(experimentConditionAssignments[0].assignedCondition.length).toEqual(100);
}
