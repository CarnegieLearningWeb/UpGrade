import { Container } from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function UpdateExperiment(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  const experimentObject = individualAssignmentExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create experiment
  await experimentService.create(individualAssignmentExperiment as any, user, new UpgradeLogger());
  let experiments = await experimentService.find(new UpgradeLogger());

  // sort conditions
  experiments[0].conditions.sort((a, b) => {
    return a.order > b.order ? 1 : a.order < b.order ? -1 : 0;
  });

  // sort decision points
  experiments[0].partitions.sort((a, b) => {
    return a.order > b.order ? 1 : a.order < b.order ? -1 : 0;
  });

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

  // edited conditions
  const editedConditions = experiments[0].conditions.map((condition, index) => {
    return {
      ...condition,
      name: `Condition ${index}`,
      description: `Condition ${index}`,
      conditionCode: `Condition ${index}`,
      assignmentWeight: index,
    };
  });

  // delete one condition
  editedConditions.pop();

  // edit decision points
  const editedDecisionPoints = experiments[0].partitions.map((decisionPoint, index) => {
    return {
      ...decisionPoint,
      description: `Decision Point on Workspace ${index}`,
    };
  });

  // delete one decision point
  editedDecisionPoints.pop();

  editedDecisionPoints[0].target = 'T1';
  editedDecisionPoints[0].site = 'Test';

  // adding new condition
  const newExperimentDoc = {
    ...experiments[0],
    conditions: [
      ...editedConditions,
      {
        name: 'Condition C',
        description: 'Condition C',
        conditionCode: 'Condition C',
        assignmentWeight: 50,
        twoCharacterId: 'CC',
      },
    ],
    partitions: [
      ...editedDecisionPoints,
      {
        site: 'CurriculumSequence ',
        target: 'W3',
        description: 'Decision Point on Workspace 3',
        twoCharacterId: 'W3',
      },
    ],
  };

  // order for condition
  newExperimentDoc.conditions.forEach((condition, index) => {
    const newCondition = { ...condition, order: index + 1 };
    newExperimentDoc.conditions[index] = newCondition;
  });

  // order for decision points
  newExperimentDoc.partitions.forEach((decisionPoint, index) => {
    const newCondition = { ...decisionPoint, order: index + 1 };
    newExperimentDoc.partitions[index] = newCondition;
  });

  const updatedExperimentDoc = await experimentService.update(newExperimentDoc as any, user, new UpgradeLogger());
  // check the conditions
  expect(updatedExperimentDoc.conditions).toEqual(
    expect.arrayContaining([
      ...editedConditions.map((condition) => {
        return expect.objectContaining({
          name: condition.name,
          description: condition.description,
          conditionCode: condition.conditionCode,
          order: condition.order,
        });
      }),
      expect.objectContaining({
        name: 'Condition C',
        description: 'Condition C',
        conditionCode: 'Condition C',
        assignmentWeight: 50,
        twoCharacterId: 'CC',
        order: 2,
      }),
    ])
  );

  // get all experimental conditions
  const experimentCondition = await experimentService.getExperimentalConditions(
    updatedExperimentDoc.id,
    new UpgradeLogger()
  );
  expect(experimentCondition.length).toEqual(updatedExperimentDoc.conditions.length);

  // check the decision points
  expect(updatedExperimentDoc.partitions).toEqual(
    expect.arrayContaining([
      ...editedDecisionPoints.map((decisionPoint) => {
        return expect.objectContaining({
          site: decisionPoint.site,
          target: decisionPoint.target,
          description: decisionPoint.description,
          order: decisionPoint.order,
        });
      }),
      expect.objectContaining({
        site: 'CurriculumSequence ',
        target: 'W3',
        description: 'Decision Point on Workspace 3',
        twoCharacterId: 'W3',
        order: 3,
      }),
    ])
  );

  // get all experimental decision points
  const experimentDecisionPoints = await experimentService.getExperimentPartitions(
    updatedExperimentDoc.id,
    new UpgradeLogger()
  );
  console.log(experimentDecisionPoints);
  expect(experimentDecisionPoints.length).toEqual(updatedExperimentDoc.partitions.length);

  // update the experiment state
  await experimentService.updateState(
    updatedExperimentDoc.id,
    EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
    user,
    new UpgradeLogger()
  );
  experiments = await experimentService.find(new UpgradeLogger());
}
