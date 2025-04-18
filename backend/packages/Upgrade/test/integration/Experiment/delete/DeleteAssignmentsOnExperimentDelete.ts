import { Container as tteContainer } from './../../../../src/typeorm-typedi-extensions/Container';
import { scheduleJobUpdateExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { getAllExperimentCondition, markExperimentPoint } from '../../utils';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { checkMarkExperimentPointForUser, checkExperimentAssignedIsNotDefault } from '../../utils/index';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { IndividualEnrollmentRepository } from '../../../../src/api/repositories/IndividualEnrollmentRepository';

export default async function UpdateExperimentState(): Promise<void> {
  const individualEnrollmentRepository = tteContainer.getCustomRepository(IndividualEnrollmentRepository);

  // const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
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

  const experimentName = experimentObject.partitions[0].target;
  const experimentPoint = experimentObject.partitions[0].site;
  const condition = experimentObject.conditions[0].conditionCode;

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  const experimentId = experiments[0].id;
  let markedExperimentPoint = await markExperimentPoint(
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[0].id, experimentName, experimentPoint);

  // change experiment status to Enrolling
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, user, new UpgradeLogger());

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

  // get all experiment condition for user 2
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger());
  checkExperimentAssignedIsNotDefault(experimentConditionAssignments, experimentName, experimentPoint);

  markedExperimentPoint = await markExperimentPoint(
    experimentUsers[1].id,
    experimentName,
    experimentPoint,
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedExperimentPoint, experimentUsers[1].id, experimentName, experimentPoint);

  let individualAssignments = await individualEnrollmentRepository.find();
  expect(individualAssignments.length).toEqual(1);

  await experimentService.delete(experimentId, user, { logger: new UpgradeLogger() });

  individualAssignments = await individualEnrollmentRepository.find();
  expect(individualAssignments.length).toEqual(0);
}
