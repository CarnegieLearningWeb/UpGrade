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

  // sort decision points
  experiments[0].partitions.sort((a, b) => {
    return a.order > b.order ? 1 : a.order < b.order ? -1 : 0;
  });

  expect(experiments[0].partitions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        site: 'CurriculumSequence',
        target: 'W1',
        description: 'Decision Point on Workspace 1',
        twoCharacterId: 'W1',
        order: 1,
      }),
      expect.objectContaining({
        site: 'CurriculumSequence',
        target: 'W2',
        description: 'Decision Point on Workspace 2',
        twoCharacterId: 'W2',
        order: 2,
      }),
      expect.objectContaining({
        site: 'CurriculumSequence',
        description: 'No Decision Point',
        twoCharacterId: 'NP',
        order: 3,
      }),
    ])
  );

  // adding new decision point
  const newExperimentDoc = {
    ...experiments[0],
    partitions: [
      ...experiments[0].partitions,
      {
        site: 'CurriculumSequence ',
        target: 'W3',
        description: 'Decision Point on Workspace 3',
        twoCharacterId: 'W3',
      },
    ],
  };

  // delete first decision point
  newExperimentDoc.partitions.shift();

  // order for condition
  newExperimentDoc.partitions.forEach((decisionPoint, index) => {
    const newDecisionPoints = { ...decisionPoint, order: index + 1 };
    newExperimentDoc.partitions[index] = newDecisionPoints;
  });

  const updatedExperimentDoc = await experimentService.update(newExperimentDoc as any, user, new UpgradeLogger());

  expect(updatedExperimentDoc.partitions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        site: 'CurriculumSequence',
        target: 'W2',
        description: 'Decision Point on Workspace 2',
        twoCharacterId: 'W2',
        order: 1,
      }),
      expect.objectContaining({
        site: 'CurriculumSequence',
        description: 'No Decision Point',
        twoCharacterId: 'NP',
        order: 2,
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
}
