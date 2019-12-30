import { scheduleJobStartExperiment } from '../../mockData/experiment/index';
import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { ScheduledJobService } from '../../../../src/api/services/ScheduledJobService';
import { SCHEDULE_TYPE } from '../../../../src/api/models/ScheduledJob';

export default async function StartExperiment(): Promise<void> {
  const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const scheduledJobService = Container.get<ScheduledJobService>(ScheduledJobService);

  // experiment object
  const experimentObject = scheduleJobStartExperiment;

  // create experiment
  await experimentService.create(experimentObject as any);
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

  await new Promise(r => setTimeout(r, 1000));
  const startExperiment = await scheduledJobService.getAllStartExperiment();

  expect(startExperiment).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experimentId: experiments[0].id,
        type: SCHEDULE_TYPE.START_EXPERIMENT,
        timeStamp: new Date(experimentObject.startOn),
      }),
    ])
  );
}
