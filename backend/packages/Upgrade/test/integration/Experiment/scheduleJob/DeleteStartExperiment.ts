import { scheduleJobStartExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { ScheduledJobService } from '../../../../src/api/services/ScheduledJobService';
import { SCHEDULE_TYPE } from '../../../../src/api/models/ScheduledJob';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function DeleteStartExperiment(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const scheduledJobService = Container.get<ScheduledJobService>(ScheduledJobService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = scheduleJobStartExperiment;

  // create experiment
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  let experiments = await experimentService.find(new UpgradeLogger());
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

  await new Promise((r) => setTimeout(r, 1000));
  let startExperiment = await scheduledJobService.getAllStartExperiment(new UpgradeLogger());

  expect(startExperiment).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experiment: expect.objectContaining({ id: experiments[0].id }),
        type: SCHEDULE_TYPE.START_EXPERIMENT,
        timeStamp: new Date(experimentObject.startOn),
      }),
    ])
  );

  const updatedExperiment = {
    ...experiments[0],
    state: EXPERIMENT_STATE.ENROLLING,
  };

  await experimentService.update(updatedExperiment, user, new UpgradeLogger());
  experiments = await experimentService.find(new UpgradeLogger());
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

  await new Promise((r) => setTimeout(r, 1000));
  startExperiment = await scheduledJobService.getAllStartExperiment(new UpgradeLogger());
  expect(startExperiment.length).toEqual(0);
}
