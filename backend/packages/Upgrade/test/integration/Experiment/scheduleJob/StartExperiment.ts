import { scheduleJobStartExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { ScheduledJobService } from '../../../../src/api/services/ScheduledJobService';
import { SCHEDULE_TYPE } from '../../../../src/api/models/ScheduledJob';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { AuditService } from '../../../../src/api/services/AuditService';
import { systemUserDoc } from '../../../../src/init/seed/systemUser';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function StartExperiment(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const scheduledJobService = Container.get<ScheduledJobService>(ScheduledJobService);
  const userService = Container.get<UserService>(UserService);
  const auditService = Container.get<AuditService>(AuditService);

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

  // change experiment status to SCHEDULED
  const experimentId = experiments[0].id;
  await experimentService.updateState(
    experimentId,
    EXPERIMENT_STATE.SCHEDULED,
    user,
    new UpgradeLogger(),
    experiments[0].startOn
  );

  // fetch experiment
  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: EXPERIMENT_STATE.SCHEDULED,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: experimentObject.assignmentUnit,
        consistencyRule: experimentObject.consistencyRule,
      }),
    ])
  );

  await new Promise((r) => setTimeout(r, 1000));
  const startExperiment = await scheduledJobService.getAllStartExperiment(new UpgradeLogger());

  expect(startExperiment).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experiment: expect.objectContaining({ id: experiments[0].id }),
        type: SCHEDULE_TYPE.START_EXPERIMENT,
        timeStamp: new Date(experimentObject.startOn),
      }),
    ])
  );

  // call scheduled service to update state for enrolling
  await scheduledJobService.startExperiment(startExperiment[0].id, new UpgradeLogger());

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

  const auditLog = await auditService.getAuditLogs(1, 0);

  expect(auditLog[0].user).toEqual(expect.objectContaining(systemUserDoc));
}
