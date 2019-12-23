import { Container } from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { Logger as WinstonLogger } from '../../../../src/lib/logger';

export default async function UpdateExperiment(): Promise<void> {
  const logger = new WinstonLogger(__filename);
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

  // edit segments
  const editedSegments = experiments[0].segments.map((segment, index) => {
    return {
      ...segment,
      description: `Segment on Workspace ${index}`,
    };
  });

  // delete one segment
  editedSegments.pop();

  editedSegments[0].name = 'T1';
  editedSegments[0].point = 'Test';
  editedSegments[0].id = 'T1_Test';

  // adding new condition
  const newExperimentDoc = {
    ...experiments[0],
    conditions: [
      ...editedConditions,
      {
        name: 'Condition C',
        description: 'Condition C',
        conditionCode: 'Condition C',
        assignmentWeight: '0.5',
      },
    ],
    segments: [
      ...editedSegments,
      {
        point: 'CurriculumSequence ',
        name: 'W3',
        description: 'Segment on Workspace 3',
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
        assignmentWeight: '0.5',
      }),
    ])
  );

  // get all experimental conditions
  const experimentCondition = await experimentService.getExperimentalConditions(updatedExperimentDoc.id);
  expect(experimentCondition.length).toEqual(updatedExperimentDoc.conditions.length);

  // check the segments
  expect(updatedExperimentDoc.segments).toEqual(
    expect.arrayContaining([
      ...editedSegments.map(segment => {
        return expect.objectContaining({
          id: segment.id,
          point: segment.point,
          name: segment.name,
          description: segment.description,
        });
      }),
      expect.objectContaining({
        point: 'CurriculumSequence ',
        name: 'W3',
        description: 'Segment on Workspace 3',
      }),
    ])
  );

  // get all experimental segments
  const experimentSegment = await experimentService.getExperimentSegments(updatedExperimentDoc.id);
  expect(experimentSegment.length).toEqual(updatedExperimentDoc.segments.length);
}
