import { Container } from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { Logger as WinstonLogger } from '../../../src/lib/logger';
import { getAllExperimentCondition } from '../utils';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { individualAssignmentExperiment } from '../mockData/experiment';
import { PreviewUserService } from '../../../src/api/services/PreviewUserService';
import { previewUsers } from '../mockData/previewUsers/index';
import { getCustomRepository } from 'typeorm';
import { GroupAssignmentRepository } from '../../../src/api/repositories/GroupAssignmentRepository';
import { GroupExclusionRepository } from '../../../src/api/repositories/GroupExclusionRepository';
import { IndividualAssignmentRepository } from '../../../src/api/repositories/IndividualAssignmentRepository';
import { IndividualExclusionRepository } from '../../../src/api/repositories/IndividualExclusionRepository';

export default async function testCase(): Promise<void> {
  const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const previewService = Container.get<PreviewUserService>(PreviewUserService);
  const groupAssignmentRepository = getCustomRepository(GroupAssignmentRepository);
  const groupExclusionRepository = getCustomRepository(GroupExclusionRepository);
  const individualAssignmentRepository = getCustomRepository(IndividualAssignmentRepository);
  const individualExclusionRepository = getCustomRepository(IndividualExclusionRepository);

  // creating new user
  const user = await userService.create(systemUser as any);

  // creating preview user
  const previewUser = await previewService.create(previewUsers[0]);

  // experiment object
  const experimentObject = individualAssignmentExperiment;

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

  // get all experiment condition for user 1
  const experimentConditionAssignments = await getAllExperimentCondition(previewUser.id);
  expect(experimentConditionAssignments).toHaveLength(0);

  // no entry in normal assignment and exclusion
  const groupAssignments = await groupAssignmentRepository.find({});
  expect(groupAssignments).toHaveLength(0);

  const groupExclusions = await groupExclusionRepository.find({});
  expect(groupExclusions).toHaveLength(0);

  const individualAssignments = await individualAssignmentRepository.find({});
  expect(individualAssignments).toHaveLength(0);

  const individualExclusions = await individualExclusionRepository.find({});
  expect(individualExclusions).toHaveLength(0);
}
