import { firstFactorialExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user';
import { experimentUsers } from '../../mockData/experimentUsers';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { getAllExperimentCondition, markExperimentPoint, checkMarkExperimentPointForUser } from '../../utils';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function FactorialExperimentEnrollment(): Promise<void> {
  // Testing for Factorial Experiment with same Decision Point

  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  const experimentObject = firstFactorialExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  const experimentTarget = experimentObject.partitions[0].target;
  const experimentSite = experimentObject.partitions[0].site;
  const conditions = experimentObject.conditions;
  const experimentID = experimentObject.id;
  const context = experimentObject.context[0];
  const experimentConditionPayload = experimentObject.conditionPayloads[0];

  // setting condition-1 weight as 100%
  conditions.sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));
  let updatedConditions = conditions.map((condition) => {
    return condition.order === 1 ? { ...condition, assignmentWeight: 100 } : { ...condition, assignmentWeight: 0 };
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
  let experimentConditionAssignments = await getAllExperimentCondition(
    experimentUsers[0].id,
    new UpgradeLogger(),
    context
  );
  expect(experimentConditionAssignments.length).toEqual(1);

  // checking conditionPayload name for conditionCode
  expect(experimentConditionAssignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        target: experimentTarget,
        site: experimentSite,
        assignedCondition: expect.arrayContaining([
          expect.objectContaining({
            id: experimentConditionPayload.parentCondition,
            conditionCode: 'Color=Red; Shape=Circle',
            payload: { type: 'string', value: experimentConditionPayload.payload.value },
          }),
        ]),
      }),
    ])
  );

  // mark experimentPoint for user 1
  let markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentTarget,
    experimentSite,
    experimentConditionPayload.payload.value,
    new UpgradeLogger(),
    experimentID
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentTarget, experimentSite);

  // setting condition-2 weight as 100%
  conditions.sort((a, b) => (a.order > b.order ? 1 : b.order > a.order ? -1 : 0));
  updatedConditions = conditions.map((condition) => {
    return condition.order === 2 ? { ...condition, assignmentWeight: 100 } : { ...condition, assignmentWeight: 0 };
  });

  const newExperimentDoc = { ...experiments[0], conditions: updatedConditions };
  await experimentService.update(newExperimentDoc as any, user, new UpgradeLogger());

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger(), context);
  expect(experimentConditionAssignments.length).toEqual(1);

  // checking conditionCode for user 2
  expect(experimentConditionAssignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        target: experimentTarget,
        site: experimentSite,
        assignedCondition: expect.arrayContaining([
          expect.objectContaining({
            conditionCode: 'Color=Blue; Shape=Rectangle',
          }),
        ]),
      }),
    ])
  );

  // mark experimentPoint for user 2
  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentTarget,
    experimentSite,
    experimentConditionPayload.payload.value,
    new UpgradeLogger(),
    experimentID
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentTarget, experimentSite);
}
