import { Container } from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function ExperimentEndDate(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  const experimentObject = individualAssignmentExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // create experiment
  await experimentService.create(individualAssignmentExperiment as any, user, new UpgradeLogger());
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

  expect(experiments[0].stateTimeLogs).toHaveLength(0);

  const experiment = { ...experiments[0], state: EXPERIMENT_STATE.ENROLLMENT_COMPLETE };
  await experimentService.updateState(experiment.id, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());
  await experimentService.updateState(experiment.id, experiment.state, user, new UpgradeLogger());

  experiments = await experimentService.find(new UpgradeLogger());

  expect(experiments[0].stateTimeLogs).toHaveLength(2);
  expect(
    experiments[0].stateTimeLogs
      .filter((state) => state.toState === EXPERIMENT_STATE.ENROLLMENT_COMPLETE)
      .map((timelogs) => timelogs.timeLog)
  ).toHaveLength(1);

  await experimentService.delete(experiment.id, user, new UpgradeLogger());

  // with updated state
  await experimentService.create({ ...individualAssignmentExperiment } as any, user, new UpgradeLogger());
  experiments = await experimentService.find(new UpgradeLogger());

  expect(experiments[0].stateTimeLogs).toHaveLength(0);

  await experimentService.updateState(experiment.id, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());
  await experimentService.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user, new UpgradeLogger());
  experiments = await experimentService.find(new UpgradeLogger());

  expect(experiments[0].stateTimeLogs).toHaveLength(2);
  expect(
    experiments[0].stateTimeLogs
      .filter((state) => state.toState === EXPERIMENT_STATE.ENROLLMENT_COMPLETE)
      .map((timelogs) => timelogs.timeLog)
  ).toHaveLength(1);

  // with second entry
  await experimentService.updateState(experiment.id, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());
  await experimentService.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user, new UpgradeLogger());
  experiments = await experimentService.find(new UpgradeLogger());

  expect(experiments[0].stateTimeLogs).toHaveLength(4);
  expect(
    experiments[0].stateTimeLogs
      .filter((state) => state.toState === EXPERIMENT_STATE.ENROLLMENT_COMPLETE)
      .map((timelogs) => timelogs.timeLog)
  ).toHaveLength(2);
}
