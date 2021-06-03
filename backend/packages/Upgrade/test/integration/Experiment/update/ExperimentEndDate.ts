import { Container } from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { individualAssignmentExperiment } from '../../mockData/experiment/index';
// import { Logger as WinstonLogger } from '../../../../src/lib/logger';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { EXPERIMENT_STATE } from 'upgrade_types';

export default async function ExperimentEndDate(): Promise<void> {
  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  const experimentObject = individualAssignmentExperiment;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any);

  // create experiment
  await experimentService.create(individualAssignmentExperiment as any, user);
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

  expect(experiments[0].endDate).toBeNull();

  const experiment = { ...experiments[0], state: EXPERIMENT_STATE.ENROLLMENT_COMPLETE };
  await experimentService.update(experiment.id, experiment, user);

  experiments = await experimentService.find();
  expect(experiments[0].endDate).not.toBeNull();

  await experimentService.delete(experiment.id, user);

  // create another experiment with enrollment complete state
  await experimentService.create(
    { ...individualAssignmentExperiment, state: EXPERIMENT_STATE.ENROLLMENT_COMPLETE } as any,
    user
  );
  experiments = await experimentService.find();
  expect(experiments[0].endDate).not.toBeNull();

  await experimentService.delete(experiment.id, user);

  // with updated state
  await experimentService.create({ ...individualAssignmentExperiment } as any, user);
  experiments = await experimentService.find();
  expect(experiments[0].endDate).toBeNull();

  await experimentService.updateState(experiment.id, EXPERIMENT_STATE.ENROLLMENT_COMPLETE, user);
  experiments = await experimentService.find();
  expect(experiments[0].endDate).not.toBeNull();
}
