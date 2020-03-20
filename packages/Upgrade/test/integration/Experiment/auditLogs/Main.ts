


import { scheduleJobUpdateExperiment } from '../../mockData/experiment/index';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { AuditService } from '../../../../src/api/services/AuditService';
import { EXPERIMENT_STATE, EXPERIMENT_LOG_TYPE } from 'ees_types';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';

export default async function UpdateExperimentState(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const auditLogService = Container.get<AuditService>(AuditService);
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.create(systemUser as any);

  // experiment object
  const experimentObject = scheduleJobUpdateExperiment;

  // create experiment
  await experimentService.create(experimentObject as any, user);
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
  const createAuditLog = await auditLogService.getAuditLogByType(EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED);

  expect(createAuditLog).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: EXPERIMENT_LOG_TYPE.EXPERIMENT_CREATED,
      }),
    ])
  );

  const updatedExperiment = {
    ...experimentObject,
    name: 'Updated Experiment',
  };
  const updateExperiment = await experimentService.update(updatedExperiment.id, updatedExperiment as any, user);

  expect(updateExperiment).toEqual(
    // expect.arrayContaining([
    expect.objectContaining({
      name: updatedExperiment.name,
      state: updatedExperiment.state,
      postExperimentRule: updatedExperiment.postExperimentRule,
      assignmentUnit: updatedExperiment.assignmentUnit,
      consistencyRule: updatedExperiment.consistencyRule,
    })
    // ])
  );

  await new Promise(r => setTimeout(r, 1000));
  const updateAuditLog = await auditLogService.getAuditLogByType(EXPERIMENT_LOG_TYPE.EXPERIMENT_UPDATED);

  expect(updateAuditLog).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: EXPERIMENT_LOG_TYPE.EXPERIMENT_UPDATED,
      }),
    ])
  );

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user);

  await new Promise(r => setTimeout(r, 1000));

  const updateStateAuditLog = await auditLogService.getAuditLogByType(EXPERIMENT_LOG_TYPE.EXPERIMENT_STATE_CHANGED);

  expect(updateStateAuditLog).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: EXPERIMENT_LOG_TYPE.EXPERIMENT_STATE_CHANGED,
      }),
    ])
  );
}
