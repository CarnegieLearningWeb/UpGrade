import { stratificationSRSExperimentAssignmentExperiment1 } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { ASSIGNMENT_ALGORITHM, ASSIGNMENT_UNIT, CONDITION_ORDER } from 'upgrade_types';
import { UserDTO } from 'src/api/DTO/UserDTO';

export default async function AlgorithmCheck(): Promise<void> {
  // Testing for Factorial Experiment with different Decision Point

  const experimentService = Container.get<ExperimentService>(ExperimentService);
  // experiment object
  const experimentObject = stratificationSRSExperimentAssignmentExperiment1;
  const userService = Container.get<UserService>(UserService);

  // creating new user
  const user = await userService.upsertUser(systemUser as UserDTO, new UpgradeLogger());

  // create experiment
  await experimentService.create(experimentObject, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: experimentObject.name,
        state: experimentObject.state,
        postExperimentRule: experimentObject.postExperimentRule,
        assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL,
        conditionOrder: CONDITION_ORDER.RANDOM,
        consistencyRule: experimentObject.consistencyRule,
        assignmentAlgorithm: ASSIGNMENT_ALGORITHM.STRATIFIED_RANDOM_SAMPLING,
      }),
    ])
  );
}
