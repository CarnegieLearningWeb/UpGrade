import { scheduleJobUpdateExperiment } from '../../mockData/experiment/index';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { ScheduledJobService } from '../../../../src/api/services/ScheduledJobService';
import { SCHEDULE_TYPE } from '../../../../src/api/models/ScheduledJob';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function UpdateExperimentState(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const scheduledJobService = Container.get<ScheduledJobService>(ScheduledJobService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = scheduleJobUpdateExperiment;

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

  let endExperiment = await scheduledJobService.getAllEndExperiment(new UpgradeLogger());

  expect(endExperiment).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experiment: expect.objectContaining({ id: experiments[0].id }),
        type: SCHEDULE_TYPE.END_EXPERIMENT,
        timeStamp: new Date(experimentObject.endOn),
      }),
    ])
  );

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  await new Promise((r) => setTimeout(r, 1000));

  // fetch experiment
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

  endExperiment = await scheduledJobService.getAllEndExperiment(new UpgradeLogger());

  expect(endExperiment).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experiment: expect.objectContaining({ id: experiments[0].id }),
        type: SCHEDULE_TYPE.END_EXPERIMENT,
        timeStamp: new Date(experimentObject.endOn),
      }),
    ])
  );

  // change experiment status to Enrollment Complete
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user, new UpgradeLogger());

  await new Promise((r) => setTimeout(r, 1000));
  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
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

  endExperiment = await scheduledJobService.getAllEndExperiment(new UpgradeLogger());
  expect(endExperiment.length).toEqual(0);
}
