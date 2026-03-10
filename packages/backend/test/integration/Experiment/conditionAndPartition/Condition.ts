import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function NoPartitionPoint(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  const experimentObject = individualAssignmentExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());

  // sort conditions
  experiments[0].conditions.sort((a, b) => {
    return a.order > b.order ? 1 : a.order < b.order ? -1 : 0;
  });

  expect(experiments[0].conditions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'Condition B',
        description: 'Condition B',
        conditionCode: 'ConditionB',
        assignmentWeight: 60,
        twoCharacterId: 'CB',
        order: 2,
      }),
      expect.objectContaining({
        name: 'Condition A',
        description: 'Condition A',
        conditionCode: 'ConditionA',
        assignmentWeight: 40,
        twoCharacterId: 'CA',
        order: 1,
      }),
    ])
  );

  // adding new condition
  const newExperimentDoc = {
    ...experiments[0],
    conditions: [
      ...experiments[0].conditions,
      {
        name: 'Condition C',
        description: 'Condition C',
        conditionCode: 'Condition C',
        assignmentWeight: 50,
        twoCharacterId: 'CC',
      },
    ],
  };

  // delete first condition
  newExperimentDoc.conditions.shift();

  // order for condition
  newExperimentDoc.conditions.forEach((condition, index) => {
    const newCondition = { ...condition, order: index + 1 };
    newExperimentDoc.conditions[index] = newCondition;
  });

  const updatedExperimentDoc = await experimentService.update(newExperimentDoc as any, user, new UpgradeLogger());

  expect(updatedExperimentDoc.conditions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'Condition B',
        description: 'Condition B',
        conditionCode: 'ConditionB',
        assignmentWeight: 60,
        twoCharacterId: 'CB',
        order: 1,
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
}
