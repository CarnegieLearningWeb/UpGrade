import { decimalWeightExperiment } from '../../mockData/experiment/index';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function DecimalAssignmentWeight(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  const experimentObject = decimalWeightExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());
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
      // assignmentWeight: parseFloat(index.toString()).toFixed(2),
    };
  });

  // delete one condition
  editedConditions.pop();

  // edit partitions
  const editedPartitions = experiments[0].partitions.map((partition, index) => {
    return {
      ...partition,
      description: `Partition on Workspace ${index}`,
    };
  });

  // delete one partition
  editedPartitions.pop();

  editedPartitions[0].expId = 'T1';
  editedPartitions[0].expPoint = 'Test';
  editedPartitions[0].id = 'T1_Test';

  // adding new condition
  const newExperimentDoc = {
    ...experiments[0],
    conditions: [
      ...editedConditions,
      {
        name: 'Condition C',
        description: 'Condition C',
        conditionCode: 'Condition C',
        assignmentWeight: 39.50,
        twoCharacterId: 'CC',
      },
    ],
    partitions: [
      ...editedPartitions,
      {
        expPoint: 'CurriculumSequence ',
        expId: 'W3',
        description: 'Partition on Workspace 3',
        twoCharacterId: 'W3',
      },
    ],
  };

  const updatedExperimentDoc = await experimentService.update(newExperimentDoc as any, user, new UpgradeLogger());
  // check the conditions
  expect(updatedExperimentDoc.conditions).toEqual(
    expect.arrayContaining([
      ...editedConditions.map((condition) => {
        return expect.objectContaining({
          name: condition.name,
          description: condition.description,
          conditionCode: condition.conditionCode,
        });
      }),
      expect.objectContaining({
        name: 'Condition C',
        description: 'Condition C',
        conditionCode: 'Condition C',
        assignmentWeight: 39.50,
        twoCharacterId: 'CC',
      }),
    ])
  );

  // get all experimental conditions
  const experimentCondition = await experimentService.getExperimentalConditions(updatedExperimentDoc.id, new UpgradeLogger());
  expect(experimentCondition.length).toEqual(updatedExperimentDoc.conditions.length);

  // check the partitions
  expect(updatedExperimentDoc.partitions).toEqual(
    expect.arrayContaining([
      ...editedPartitions.map((partition) => {
        return expect.objectContaining({
          id: partition.id,
          expPoint: partition.expPoint,
          expId: partition.expId,
          description: partition.description,
        });
      }),
      expect.objectContaining({
        expPoint: 'CurriculumSequence ',
        expId: 'W3',
        description: 'Partition on Workspace 3',
        twoCharacterId: 'W3',
      }),
    ])
  );

  // get all experimental partitions
  const experimentPartition = await experimentService.getExperimentPartitions(updatedExperimentDoc.id, new UpgradeLogger());
  expect(experimentPartition.length).toEqual(updatedExperimentDoc.partitions.length);

  // delete the experiment
  await experimentService.delete(updatedExperimentDoc.id, user, new UpgradeLogger());
  const allExperiments = await experimentService.find(new UpgradeLogger());
  expect(allExperiments.length).toEqual(0);

  const experimentPartitions = await experimentService.getAllExperimentPartitions(new UpgradeLogger());
  expect(experimentPartitions.length).toEqual(0);
}
