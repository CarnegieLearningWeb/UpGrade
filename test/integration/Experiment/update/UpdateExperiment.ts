import { Container } from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';

export default async function UpdateExperiment(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  const experimentObject = individualAssignmentExperiment;

  // create experiment
  await experimentService.create(individualAssignmentExperiment as any);
  const experiments = await experimentService.find();
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

  // edit partitions
  const editedPartitions = experiments[0].partitions.map((partition, index) => {
    return {
      ...partition,
      description: `Partition on Workspace ${index}`,
    };
  });

  // delete one partition
  editedPartitions.pop();

  editedPartitions[0].name = 'T1';
  editedPartitions[0].point = 'Test';
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
        assignmentWeight: 50,
      },
    ],
    partitions: [
      ...editedPartitions,
      {
        point: 'CurriculumSequence ',
        name: 'W3',
        description: 'Partition on Workspace 3',
      },
    ],
  };

  const updatedExperimentDoc = await experimentService.update(newExperimentDoc.id, newExperimentDoc as any);
  // check the conditions
  expect(updatedExperimentDoc.conditions).toEqual(
    expect.arrayContaining([
      ...editedConditions.map(condition => {
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
        assignmentWeight: 50,
      }),
    ])
  );

  // get all experimental conditions
  const experimentCondition = await experimentService.getExperimentalConditions(updatedExperimentDoc.id);
  expect(experimentCondition.length).toEqual(updatedExperimentDoc.conditions.length);

  // check the partitions
  expect(updatedExperimentDoc.partitions).toEqual(
    expect.arrayContaining([
      ...editedPartitions.map(partition => {
        return expect.objectContaining({
          id: partition.id,
          point: partition.point,
          name: partition.name,
          description: partition.description,
        });
      }),
      expect.objectContaining({
        point: 'CurriculumSequence ',
        name: 'W3',
        description: 'Partition on Workspace 3',
      }),
    ])
  );

  // get all experimental partitions
  const experimentPartition = await experimentService.getExperimentPartitions(updatedExperimentDoc.id);
  expect(experimentPartition.length).toEqual(updatedExperimentDoc.partitions.length);
}
