import { Container } from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { Logger as WinstonLogger } from '../../../src/lib/logger';
import { getAllExperimentCondition } from '../utils';
import { UserService } from '../../../src/api/services/UserService';
import { systemUser } from '../mockData/user/index';
import { previewIndividualAssignmentExperiment } from '../mockData/experiment';
import { getCustomRepository } from 'typeorm';
import { PreviewGroupAssignmentRepository } from '../../../src/api/repositories/PreviewGroupAssignmentRepository';
import { PreviewGroupExclusionRepository } from '../../../src/api/repositories/PreviewGroupExclusionRepository';
import { PreviewIndividualAssignmentRepository } from '../../../src/api/repositories/PreviewIndividualAssignmentRepository';
import { PreviewIndividualExclusionRepository } from '../../../src/api/repositories/PreviewIndividualExclusionRepository';
import { experimentUsers } from '../mockData/experimentUsers/index';

export default async function testCase(): Promise<void> {
  const logger = new WinstonLogger(__filename);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const previewGroupAssignmentRepository = getCustomRepository(PreviewGroupAssignmentRepository);
  const previewGroupExclusionRepository = getCustomRepository(PreviewGroupExclusionRepository);
  const previewIndividualAssignmentRepository = getCustomRepository(PreviewIndividualAssignmentRepository);
  const previewIndividualExclusionRepository = getCustomRepository(PreviewIndividualExclusionRepository);

  // creating new user
  const user = await userService.create(systemUser as any);

  // experiment object
  const experimentObject = previewIndividualAssignmentExperiment;

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
  const experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id);
  expect(experimentConditionAssignments).toHaveLength(0);

  // no entry in normal assignment and exclusion
  const groupAssignments = await previewGroupAssignmentRepository.find({});
  expect(groupAssignments).toHaveLength(0);

  const groupExclusions = await previewGroupExclusionRepository.find({});
  expect(groupExclusions).toHaveLength(0);

  const individualAssignments = await previewIndividualAssignmentRepository.find({});
  expect(individualAssignments).toHaveLength(0);

  const individualExclusions = await previewIndividualExclusionRepository.find({});
  expect(individualExclusions).toHaveLength(0);
}
