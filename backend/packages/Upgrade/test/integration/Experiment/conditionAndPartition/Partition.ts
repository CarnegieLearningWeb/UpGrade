import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function NoPartitionPoint(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  const experimentObject = individualAssignmentExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());

  // sort partitions
  experiments[0].partitions.sort((a,b) => {
    return a.order > b.order ? 1 : a.order < b.order ? -1 : 0
  });

  expect(experiments[0].partitions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        expPoint: 'CurriculumSequence',
        expId: 'W1',
        description: 'Partition on Workspace 1',
        twoCharacterId: 'W1',
        order: 1,
      }),
      expect.objectContaining({
        expPoint: 'CurriculumSequence',
        expId: 'W2',
        description: 'Partition on Workspace 2',
        twoCharacterId: 'W2',
        order: 2,
      }),
      expect.objectContaining({
        expPoint: 'CurriculumSequence',
        description: 'No Partition',
        twoCharacterId: 'NP',
        order: 3,
      }),
    ])
  );


  // adding new partition
  const newExperimentDoc = {
    ...experiments[0],
    partitions: [
      ...experiments[0].partitions,
      {
        expPoint: 'CurriculumSequence ',
        expId: 'W3',
        description: 'Partition on Workspace 3',
        twoCharacterId: 'W3',
      },
    ],
  }

  // delete first partition
  newExperimentDoc.partitions.shift()

  // order for condition
  newExperimentDoc.partitions.forEach((partition,index) => {
    const newPartition = {...partition, order: index + 1};
    newExperimentDoc.partitions[index] = newPartition;
  });

  const updatedExperimentDoc = await experimentService.update(newExperimentDoc.id, newExperimentDoc as any, user, new UpgradeLogger());

  expect(updatedExperimentDoc.partitions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        expPoint: 'CurriculumSequence',
        expId: 'W2',
        description: 'Partition on Workspace 2',
        twoCharacterId: 'W2',
        order: 1,
      }),
      expect.objectContaining({
        expPoint: 'CurriculumSequence',
        description: 'No Partition',
        twoCharacterId: 'NP',
        order: 2,
      }),
      expect.objectContaining({
        expPoint: 'CurriculumSequence ',
        expId: 'W3',
        description: 'Partition on Workspace 3',
        twoCharacterId: 'W3',
        order: 3,
      }),
    ])
  )
}
