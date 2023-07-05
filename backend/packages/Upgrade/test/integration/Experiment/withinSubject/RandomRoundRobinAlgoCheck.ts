import { withinSubjectExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user';
import { experimentUsers } from '../../mockData/experimentUsers';
import { CONDITION_ORDER, EXPERIMENT_STATE } from 'upgrade_types';
import { getAllExperimentCondition } from '../../utils';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function RamdomRoundRobinAlgoCheck(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  let experimentObject = withinSubjectExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  experimentObject = { ...experimentObject, conditionOrder: CONDITION_ORDER.RANDOM_ROUND_ROBIN };
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
  const totalConditionsPair = Math.ceil(100 / conditions.length);
  expect(experimentConditionAssignments[0].assignedCondition.length).toEqual(totalConditionsPair * conditions.length);

  const tempConditionArray = [...conditions];
  let allConditionIndludedFlag = true;
  let conditionIndex = -1;
  for (let i = 0; i < conditions.length; i++) {
    for (let j = 0; j < tempConditionArray.length; j++) {
      if (experimentConditionAssignments[0].assignedCondition[i].id === tempConditionArray[j].id) {
        conditionIndex = j;
        break;
      }
    }
    if (conditionIndex >= 0) {
      tempConditionArray.splice(conditionIndex, 1);
      continue;
    } else {
      allConditionIndludedFlag = false;
    }
  }
  expect(allConditionIndludedFlag).toEqual(true);
}
