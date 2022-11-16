import { aliasConditionExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { getManager } from 'typeorm';
import { ExperimentCondition } from '../../../../src/api/models/ExperimentCondition';
import { DecisionPoint } from '../../../../src/api/models/DecisionPoint';

export default async function ConditionAlias(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const entityManager = getManager();

  // experiment object
  const experimentObject = aliasConditionExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.findOne(experimentObject.id, new UpgradeLogger());

  // sort conditionAliases
  experiments.conditionAliases.sort((a, b) => {
    return a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
  });

  expect(experiments.conditionAliases.length).toEqual(2);
  expect(experiments.conditionAliases).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: '9d753b90-1111-44b5-8acc-2483c0507ea0',
        aliasName: 'ConditionA_W1',
      }),
      expect.objectContaining({
        id: '9d753b90-1111-44b5-8acc-2483c0507ea1',
        aliasName: 'ConditionA_W2',
      }),
    ])
  );

  // delete first conditionAlias
  experiments.conditionAliases.shift();

  // updating conditionAlias name
  experiments.conditionAliases[0].aliasName = 'ConditionA_W2_updated';

  // adding new conditionAlias
  const newExperimentDoc = {
    ...experiments,
    conditionAliases: [
      ...experiments.conditionAliases,
      {
        id: '9d753b90-1111-44b5-8acc-2483c0507ea2',
        aliasName: 'ConditionB_W2',
        parentCondition: 'd2702d3c-5e04-41a7-8766-1da8a95b72ce',
        decisionPoint: 'e22467b1-f0e9-4444-9517-cc03037bc079',
      },
    ],
  };

  let updatedExperimentDoc = await experimentService.update(newExperimentDoc as any, user, new UpgradeLogger());

  expect(updatedExperimentDoc.conditionAliases).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: '9d753b90-1111-44b5-8acc-2483c0507ea2',
        aliasName: 'ConditionB_W2',
      }),
      expect.objectContaining({
        id: '9d753b90-1111-44b5-8acc-2483c0507ea1',
        aliasName: 'ConditionA_W2_updated',
      }),
    ])
  );

  // delete first condition
  updatedExperimentDoc.conditions.sort((a, b) => {
    return a.order > b.order ? 1 : a.order < b.order ? -1 : 0;
  });
  await entityManager.delete(ExperimentCondition, updatedExperimentDoc.conditions[0].id);

  // conditionAlias related to condition should also gets deleted
  updatedExperimentDoc = await experimentService.findOne(updatedExperimentDoc.id as any, new UpgradeLogger());

  expect(updatedExperimentDoc.conditionAliases.length).toEqual(1);
  expect(updatedExperimentDoc.conditionAliases).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: '9d753b90-1111-44b5-8acc-2483c0507ea2',
        aliasName: 'ConditionB_W2',
      }),
    ])
  );

  // delete second partition
  updatedExperimentDoc.partitions.sort((a, b) => {
    return a.order > b.order ? 1 : a.order < b.order ? -1 : 0;
  });
  await entityManager.delete(DecisionPoint, updatedExperimentDoc.partitions[1].id);

  // conditionAlias related to decitionPoint should also gets deleted
  updatedExperimentDoc = await experimentService.findOne(updatedExperimentDoc.id as any, new UpgradeLogger());
  expect(updatedExperimentDoc.conditionAliases.length).toEqual(0);
}
