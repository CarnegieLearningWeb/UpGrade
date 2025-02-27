import Container from 'typedi';
import { ExperimentService } from '../../../src/api/services/ExperimentService';
import { UserService } from '../../../src/api/services/UserService';
import { CheckService } from '../../../src/api/services/CheckService';
import { UpgradeLogger } from '../../../src/lib/logger/UpgradeLogger';
import { segmentFourth, segmentThird } from '../mockData/segment';
import { systemUser } from '../mockData/user/index';
import { groupAssignmentWithIndividualConsistencyExperiment } from '../mockData/experiment/index';
import { ENROLLMENT_CODE, EXPERIMENT_STATE } from 'upgrade_types';
import { experimentUsers } from '../mockData/experimentUsers/index';
import { getAllExperimentCondition, markExperimentPoint } from '../utils';
import { checkMarkExperimentPointForUser } from '../utils/index';

export default async function GroupExclusionSegmentIndividualConsistency(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const checkService = Container.get<CheckService>(CheckService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // group experiment object
  const experimentObject = JSON.parse(JSON.stringify(groupAssignmentWithIndividualConsistencyExperiment));

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

  // change experiment status to Enrolling
  const experimentId = experiments[0].id;
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

  // get all experiment condition for user 1
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(3);

  // mark experiment point for user 1
  let markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint, condition, experimentId, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user should be enrolled, as not exclusions added yet:
  let individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(0);

  let groupExclusions = await checkService.getAllGroupExclusions();
  expect(groupExclusions.length).toEqual(0);

  let individualAssignments = await checkService.getAllIndividualAssignment();
  expect(individualAssignments.length).toEqual(1);
  expect(individualAssignments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        user: expect.objectContaining({
          id: experimentUsers[0].id
        }),
        enrollmentCode: ENROLLMENT_CODE.ALGORITHMIC 
      })
    ])
  );

  // create group exclusion segment
  let segmentObject = segmentThird;

  // await segmentService.upsertSegment(segmentObject, new UpgradeLogger(), "exclude");
  // let segments = await segmentService.getAllSegments(new UpgradeLogger());
  // expect(segments.length).toEqual(1);
  // expect(segments).toEqual(
  //   expect.arrayContaining([
  //     expect.objectContaining({
  //       name: globalExcludeSegment.name,
  //       description: globalExcludeSegment.description,
  //       context: globalExcludeSegment.context,
  //       type: globalExcludeSegment.type,
  //       individualForSegment: expect.arrayContaining([]),
  //       groupForSegment: expect.arrayContaining([]),
  //       subSegments: expect.arrayContaining([]),
  //     }),
  //     expect.objectContaining({
  //       name: segmentObject.name,
  //       description: segmentObject.description,
  //       context: segmentObject.context,
  //       type: segmentObject.type,
  //       individualForSegment: expect.arrayContaining([]),
  //       groupForSegment: expect.arrayContaining([
  //         expect.objectContaining({
  //           groupId: segmentObject.groups[0].groupId,
  //           type: segmentObject.groups[0].type,
  //         }),
  //       ]),
  //     }),
  //   ])
  // );

  experimentObject.state = 'enrolling';
  console.log("exc segments: ", segmentObject)
  experimentObject.experimentSegmentExclusion = segmentObject;

  // update experiment with the above segment Object:
  await experimentService.update(experimentObject as any, user, new UpgradeLogger());

  // create segment to include above users who already reached before
  let segmentObject1 = segmentFourth;
  // await segmentService.upsertSegment(segmentObject, new UpgradeLogger(), "include");
  // segments = await segmentService.getAllSegments(new UpgradeLogger());
  // expect(segments.length).toEqual(3);
  console.log("inc segments: ", segmentObject1)
  experimentObject.state = 'enrolling';
  experimentObject.experimentSegmentInclusion.segment.groupForSegment = [];
  experimentObject.experimentSegmentInclusion.segment.individualForSegment = [segmentObject1];
  console.log("experimentObject: ", experimentObject)
  // update experiment with the above segment Object:
  await experimentService.update(experimentObject as any, user, new UpgradeLogger());

  // fetch experiment

  experiments = await experimentService.find(new UpgradeLogger());
  console.log("exc: ", experiments[0].experimentSegmentExclusion)
  console.log("inc: ", experiments[0].experimentSegmentInclusion)
  // get all experiment condition for user 1
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(3);

  // mark experiment point for user 1
  markedExperimentPoint = await markExperimentPoint(experimentUsers[0].id, experimentName, experimentPoint, condition, experimentId, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[0].id,
    experimentName,
    experimentPoint,
    2
  );

  // the user should be still enrolled:
  groupExclusions = await checkService.getAllGroupExclusions();
  expect(groupExclusions.length).toEqual(0);

  individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(0);

  individualAssignments = await checkService.getAllIndividualAssignment();
  expect(individualAssignments.length).toEqual(1);
}
