import { payloadConditionExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { getManager } from 'typeorm';
import { ExperimentCondition } from '../../../../src/api/models/ExperimentCondition';
import { DecisionPoint } from '../../../../src/api/models/DecisionPoint';
import { PAYLOAD_TYPE } from '../../../../../../../types/src';

export default async function ConditionPayload(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const entityManager = getManager();

  // experiment object
  const experimentObject = payloadConditionExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.getSingleExperiment(experimentObject.id, new UpgradeLogger());

  // sort conditionPayloads
  experiments.conditionPayloads.sort((a, b) => {
    return a.id > b.id ? 1 : a.id < b.id ? -1 : 0;
  });

  expect(experiments.conditionPayloads.length).toEqual(2);
  expect(experiments.conditionPayloads).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: '9d753b90-1111-44b5-8acc-2483c0507ea0',
        payload: {
          value: 'ConditionA_W1',
          type: PAYLOAD_TYPE.STRING,
        },
      }),
      expect.objectContaining({
        id: '9d753b90-1111-44b5-8acc-2483c0507ea1',
        payload: {
          value: 'ConditionA_W2',
          type: PAYLOAD_TYPE.STRING,
        },
      }),
    ])
  );

  // delete first conditionPayload
  experiments.conditionPayloads.shift();

  // updating conditionPayload name
  experiments.conditionPayloads[0].payload.value = 'ConditionA_W2_updated';

  // adding new conditionPayload
  const newExperimentDoc = {
    ...experiments,
    conditionPayloads: [
      ...experiments.conditionPayloads,
      {
        id: '9d753b90-1111-44b5-8acc-2483c0507ea2',
        payload: {
          value: 'ConditionB_W2',
          type: PAYLOAD_TYPE.STRING,
        },
        parentCondition: 'd2702d3c-5e04-41a7-8766-1da8a95b72ce',
        decisionPoint: 'e22467b1-f0e9-4444-9517-cc03037bc079',
      },
    ],
  };

  let updatedExperimentDoc = await experimentService.update(newExperimentDoc as any, user, new UpgradeLogger());

  expect(updatedExperimentDoc.conditionPayloads).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: '9d753b90-1111-44b5-8acc-2483c0507ea2',
        payload: {
          value: 'ConditionB_W2',
          type: PAYLOAD_TYPE.STRING,
        },
      }),
      expect.objectContaining({
        id: '9d753b90-1111-44b5-8acc-2483c0507ea1',
        payload: {
          value: 'ConditionA_W2_updated',
          type: PAYLOAD_TYPE.STRING,
        },
      }),
    ])
  );

  // delete first conditionpayload
  updatedExperimentDoc.conditions.sort((a, b) => {
    return a.order > b.order ? 1 : a.order < b.order ? -1 : 0;
  });
  await entityManager.delete(ExperimentCondition, updatedExperimentDoc.conditions[0].id);

  // conditionPayload related to condition should also gets deleted
  updatedExperimentDoc = await experimentService.getSingleExperiment(
    updatedExperimentDoc.id as any,
    new UpgradeLogger()
  );

  expect(updatedExperimentDoc.conditionPayloads.length).toEqual(1);
  expect(updatedExperimentDoc.conditionPayloads).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: '9d753b90-1111-44b5-8acc-2483c0507ea2',
        payload: {
          value: 'ConditionB_W2',
          type: PAYLOAD_TYPE.STRING,
        },
      }),
    ])
  );

  // delete second partition
  updatedExperimentDoc.partitions.sort((a, b) => {
    return a.order > b.order ? 1 : a.order < b.order ? -1 : 0;
  });
  await entityManager.delete(DecisionPoint, updatedExperimentDoc.partitions[1].id);

  // conditionPayload related to decitionPoint should also gets deleted
  updatedExperimentDoc = await experimentService.getSingleExperiment(
    updatedExperimentDoc.id as any,
    new UpgradeLogger()
  );
  expect(updatedExperimentDoc.conditionPayloads.length).toEqual(0);
}
