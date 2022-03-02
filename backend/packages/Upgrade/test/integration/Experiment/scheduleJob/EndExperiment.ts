import { scheduleJobEndExperiment } from '../../mockData/experiment/index';
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

export default async function EndExperiment(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const scheduledJobService = Container.get<ScheduledJobService>(ScheduledJobService);
  const userService = Container.get<UserService>(UserService);
  const auditService = Container.get<AuditService>(AuditService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // experiment object
  const experimentObject = scheduleJobEndExperiment;

  // create experiment
  await experimentService.create(scheduleJobEndExperiment as any, user, new UpgradeLogger());
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
  const endExperiment = await scheduledJobService.getAllEndExperiment(new UpgradeLogger());

  expect(endExperiment).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        experiment: expect.objectContaining({ id: experiments[0].id }),
        type: SCHEDULE_TYPE.END_EXPERIMENT,
        timeStamp: new Date(experimentObject.endOn),
      }),
    ])
  );

  // call scheduled service to update state for enrolling
  await scheduledJobService.endExperiment(endExperiment[0].id, new UpgradeLogger());

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

  const auditLog = await auditService.getAuditLogs(1, 0);

  expect(auditLog[0].user).toEqual(expect.objectContaining(systemUserDoc));

  experiments = await experimentService.find(new UpgradeLogger());
  await experimentService.updateState(experiments[0].id, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

  experiments = await experimentService.find(new UpgradeLogger());
  // change to enrolling
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
}
