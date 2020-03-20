import { scheduleJobStartExperiment } from '../../mockData/experiment/index';
import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { ScheduledJobService } from '../../../../src/api/services/ScheduledJobService';
import { SCHEDULE_TYPE } from '../../../../src/api/models/ScheduledJob';
import { EXPERIMENT_STATE } from 'ees_types';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';

export default async function DeleteStartExperiment(): Promise<void> {
  const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const scheduledJobService = Container.get<ScheduledJobService>(ScheduledJobService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.create(systemUser as any);

  // experiment object
  const experimentObject = scheduleJobStartExperiment;

  // create experiment
  await experimentService.create(experimentObject as any, user);
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

  await new Promise(r => setTimeout(r, 1000));
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

  // const updatedExperiment = {
  //   ...experiments[0],
  //   state: EXPERIMENT_STATE.ENROLLING,
  // };

  // await experimentService.update(updatedExperiment.id, updatedExperiment, user);
  // experiments = await experimentService.find();
  // expect(experiments).toEqual(
  //   expect.arrayContaining([
  //     expect.objectContaining({
  //       name: experimentObject.name,
  //       state: EXPERIMENT_STATE.ENROLLING,
  //       postExperimentRule: experimentObject.postExperimentRule,
  //       assignmentUnit: experimentObject.assignmentUnit,
  //       consistencyRule: experimentObject.consistencyRule,
  //     }),
  //   ])
  // );

  // await new Promise(r => setTimeout(r, 1000));
  // startExperiment = await scheduledJobService.getAllStartExperiment();
  // expect(startExperiment.length).toEqual(0);
}
