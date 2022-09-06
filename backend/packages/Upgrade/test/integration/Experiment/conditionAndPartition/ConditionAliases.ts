import { aliasConditionExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function ConditionAlias(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  const experimentObject = aliasConditionExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());

  // sort conditionAliases
  experiments[0].conditionAliases.sort((a,b) => {
    return a.id > b.id ? 1 : a.id < b.id ? -1 : 0
  });

  expect(experiments[0].conditionAliases).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "9d753b90-1111-44b5-8acc-2483c0507ea0",
        aliasName: "ConditionA_W1",
        parentCondition: "c22467b1-f0e9-4444-9517-cc03037bc079",
        decisionPoint: "W1_CurriculumSequence"
      }),
      expect.objectContaining({
        id: "9d753b90-1111-44b5-8acc-2483c0507ea1",
        aliasName: "ConditionA_W2",
        parentCondition: "c22467b1-f0e9-4444-9517-cc03037bc079",
        decisionPoint: "W2_CurriculumSequence"
      }),
    ])
  );

  
  // delete first conditionAlias
  experiments[0].conditionAliases.shift()

  // updating conditionAlias name
  experiments[0].conditionAliases[0].aliasName = "ConditionA_W2_updated"

  // adding new conditionAlias
  const newExperimentDoc = {
    ...experiments[0],
    conditionAliases: [
      ...experiments[0].conditionAliases,
      {
        id: "9d753b90-1111-44b5-8acc-2483c0507ea2",
        aliasName: "ConditionB_W2",
        parentCondition: "d2702d3c-5e04-41a7-8766-1da8a95b72ce",
        decisionPoint: "W2_CurriculumSequence"
      },
    ],
  }

  let updatedExperimentDoc = await experimentService.update(newExperimentDoc as any, user, new UpgradeLogger());

  expect(updatedExperimentDoc[0].conditionAliases).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "9d753b90-1111-44b5-8acc-2483c0507ea2",
        aliasName: "ConditionB_W2",
        parentCondition: "d2702d3c-5e04-41a7-8766-1da8a95b72ce",
        decisionPoint: "W2_CurriculumSequence"
      }),
      expect.objectContaining({
        id: "9d753b90-1111-44b5-8acc-2483c0507ea1",
        aliasName: "ConditionA_W2_updated",
        parentCondition: "c22467b1-f0e9-4444-9517-cc03037bc079",
        decisionPoint: "W2_CurriculumSequence"
      }),
    ])
  );

  // delete first condition
  updatedExperimentDoc[0].conditions.sort((a,b) => {
    return a.order > b.order ? 1 : a.order < b.order ? -1 : 0
  });
  updatedExperimentDoc.conditions.shift()

  updatedExperimentDoc = await experimentService.update(updatedExperimentDoc as any, user, new UpgradeLogger());

  expect(updatedExperimentDoc[0].conditionAliases).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: "9d753b90-1111-44b5-8acc-2483c0507ea2",
        aliasName: "ConditionB_W2",
        parentCondition: "d2702d3c-5e04-41a7-8766-1da8a95b72ce",
        decisionPoint: "W2_CurriculumSequence"
      })
    ])
  );

  // delete second partition
  updatedExperimentDoc[0].partitions.sort((a,b) => {
    return a.order > b.order ? 1 : a.order < b.order ? -1 : 0
  });
  updatedExperimentDoc.partitions.pop()

  updatedExperimentDoc = await experimentService.update(updatedExperimentDoc as any, user, new UpgradeLogger());

  expect(updatedExperimentDoc[0].conditionAliases.length).toEqual(0);
}