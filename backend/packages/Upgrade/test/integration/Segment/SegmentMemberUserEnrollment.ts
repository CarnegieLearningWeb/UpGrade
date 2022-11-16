import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { UserService } from '../../../src/api/services/UserService';
import Container from 'typedi';
import { EXPERIMENT_STATE, FILTER_MODE } from 'upgrade_types';
import { SegmentService } from '../../../src/api/services/SegmentService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { individualAssignmentExperiment } from '../mockData/experiment';
import { experimentUsers } from '../mockData/experimentUsers';
import { segment } from '../mockData/segment';
import { systemUser } from '../mockData/user';
import { getAllExperimentCondition } from '../utils';

export default async function SegmentMemberUserEnrollment(): Promise<void> {
  const userService = Container.get<UserService>(UserService);
  const segmentService = Container.get<SegmentService>(SegmentService);
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const logger = new UpgradeLogger();

  // creating new user
  const userIn = await userService.upsertUser(systemUser as any, logger);

  // create segment
  const segmentObject = segment;
  await segmentService.upsertSegment(segmentObject, logger);

  // experiment object
  const experimentObject = individualAssignmentExperiment;
  experimentObject.filterMode = FILTER_MODE.INCLUDE_ALL;
  experimentObject.experimentSegmentInclusion = { ...experimentObject.experimentSegmentInclusion };
  const context = experimentObject.context[0];

  // create experiment
  await experimentService.create(individualAssignmentExperiment as any, userIn, logger);
  let experiments = await experimentService.find(logger);
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

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.ENROLLING, userIn, logger);

  // fetch experiment
  experiments = await experimentService.find(logger);
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

  // store individual user over here
  const user = experimentUsers[0];
  const user2 = experimentUsers[5];

  // get all experiment condition
  let experimentCondition = await getAllExperimentCondition(user.id, new UpgradeLogger(), context);
  expect(experimentCondition.length).toEqual(3);

  // get all experiment condition
  experimentCondition = await getAllExperimentCondition(user2.id, new UpgradeLogger(), context);
  expect(experimentCondition.length).toEqual(3);
}
