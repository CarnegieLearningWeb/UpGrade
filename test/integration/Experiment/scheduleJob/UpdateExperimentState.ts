import { scheduleJobUpdateExperiment } from '../../mockData/experiment/index';
import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { ScheduledJobService } from '../../../../src/api/services/ScheduledJobService';
import { SCHEDULE_TYPE } from '../../../../src/api/models/ScheduledJob';
import { EXPERIMENT_STATE } from 'ees_types';
import { ExperimentAssignmentService } from '../../../../src/api/services/ExperimentAssignmentService';

export default async function UpdateExperimentState(): Promise<void> {
  const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const scheduledJobService = Container.get<ScheduledJobService>(ScheduledJobService);
  const experimentAssignmentService = Container.get<ExperimentAssignmentService>(ExperimentAssignmentService);

  // experiment object
  const experimentObject = scheduleJobUpdateExperiment;

  // create experiment
  await experimentService.create(experimentObject as any);
  let experiments = await experimentService.find();
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

  let startExperiment = await scheduledJobService.getAllStartExperiment();

  expect(startExperiment).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experimentId: experiments[0].id,
        type: SCHEDULE_TYPE.START_EXPERIMENT,
        timeStamp: new Date(experimentObject.startOn),
      }),
    ])
  );

  let endExperiment = await scheduledJobService.getAllEndExperiment();

  expect(endExperiment).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experimentId: experiments[0].id,
        type: SCHEDULE_TYPE.END_EXPERIMENT,
        timeStamp: new Date(experimentObject.endOn),
      }),
    ])
  );

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
  await experimentAssignmentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING);

  // fetch experiment
  experiments = await experimentService.find();
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: EXPERIMENT_STATE.ENROLLING,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  startExperiment = await scheduledJobService.getAllStartExperiment();
  expect(startExperiment.length).toEqual(0);

  endExperiment = await scheduledJobService.getAllEndExperiment();

  expect(endExperiment).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experimentId: experiments[0].id,
        type: SCHEDULE_TYPE.END_EXPERIMENT,
        timeStamp: new Date(experimentObject.endOn),
      }),
    ])
  );

  // change experiment status to Enrollment Complete
  await experimentAssignmentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE);

  // fetch experiment
  experiments = await experimentService.find();
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: EXPERIMENT_STATE.ENROLLMENT_COMPLETE,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  endExperiment = await scheduledJobService.getAllEndExperiment();
  expect(endExperiment.length).toEqual(0);
}
