import { Container } from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { groupLevelExclusionExperiment } from '../../mockData/experiment/index';
import { getAllExperimentCondition, markExperimentPoint } from '../../utils';
import { checkMarkExperimentPointForUser } from '../../utils/index';
import { CheckService } from '../../../../src/api/services/CheckService';
import { experimentUsers } from '../../mockData/experimentUsers/index';
import { EXCLUSION_CODE, EXPERIMENT_STATE } from 'upgrade_types';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';

export default async function testCase(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const checkService = Container.get<CheckService>(CheckService);

  // creating new user
  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // First excluding a group to check "EXCLUDED_DUE_TO_GROUP_LOGIC"
  // group experiment object
  const experimentObject = JSON.parse(JSON.stringify(groupLevelExclusionExperiment));

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
  
  // get all experiment condition for user 3
  let experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point for user 3
  let markedExperimentPoint = await markExperimentPoint(experimentUsers[2].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[2].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user should be excluded due to 'GROUP_ON_EXCLUSION_LIST' exclusion code:
  let groupExclusions = await checkService.getAllGroupExclusions();
  expect(groupExclusions.length).toEqual(1);
  expect(groupExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experiments[0].id + "_" + experimentUsers[2].workingGroup[Object.keys(experimentUsers[2].workingGroup)[0]],
        exclusionCode: EXCLUSION_CODE.GROUP_ON_EXCLUSION_LIST
      })
    ])
  );

  let individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(1);
  // EXCLUDED_DUE_TO_GROUP_LOGIC
  experimentObject.state = 'enrolling';
  experimentObject.experimentSegmentExclusion = {
    "segment": {
        "id": "1b0c0200-7a15-4e19-8688-f9ac283f18aa",
        "name": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment",
        "description": "8b0e562a-029e-4680-836c-7de6b2ef6ac9 Exclusion Segment",
        "context": "home",
        "type": "private",
        "individualForSegment": [],
        "groupForSegment": [],
        "subSegments": []
    }
  };

  await experimentService.update(experimentObject as any, user, new UpgradeLogger());

  // get all experiment condition for user 4
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[3].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[3].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[3].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user should be excluded due to 'EXCLUDED_DUE_TO_GROUP_LOGIC' exclusion code:
  groupExclusions = await checkService.getAllGroupExclusions();
  expect(groupExclusions.length).toEqual(1);

  individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(2);
  expect(individualExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experiments[0].id + "_" + experimentUsers[3].id,
        exclusionCode: EXCLUSION_CODE.EXCLUDED_DUE_TO_GROUP_LOGIC
      })
    ])
  );

  // NO_GROUP_SPECIFIED

  // get all experiment condition for user 7 with empty group
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[6].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[6].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[6].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user should be excluded due to 'NO_GROUP_SPECIFIED' exclusion code:
  individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(3);
  expect(individualExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experiments[0].id + "_" + experimentUsers[6].id,
        exclusionCode: EXCLUSION_CODE.NO_GROUP_SPECIFIED 
      })
    ])
  );

  // get all experiment condition for user 8 with no group
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[7].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[7].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[7].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user should be excluded due to 'NO_GROUP_SPECIFIED' exclusion code:
  individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(4);
  expect(individualExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experiments[0].id + "_" + experimentUsers[7].id,
        exclusionCode: EXCLUSION_CODE.NO_GROUP_SPECIFIED 
      })
    ])
  );

  // get all experiment condition for user 9 with empty workingGroup
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[8].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[8].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[8].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user should be excluded due to 'NO_GROUP_SPECIFIED' exclusion code:
  individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(5);
  expect(individualExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experiments[0].id + "_" + experimentUsers[8].id,
        exclusionCode: EXCLUSION_CODE.NO_GROUP_SPECIFIED 
      })
    ])
  );

  // get all experiment condition for user 10 with no workingGroup
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[9].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[9].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[9].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user should be excluded due to 'NO_GROUP_SPECIFIED' exclusion code:
  individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(6);
  expect(individualExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experiments[0].id + "_" + experimentUsers[9].id,
        exclusionCode: EXCLUSION_CODE.NO_GROUP_SPECIFIED 
      })
    ])
  );

  // INVALID_GROUP_OR_WORKING_GROUP

  // get all experiment condition for user 11 with wrong workingGroup
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[10].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[10].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[10].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user should be excluded due to 'INVALID_GROUP_OR_WORKING_GROUP' exclusion code:
  individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(7);
  expect(individualExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experiments[0].id + "_" + experimentUsers[10].id,
        exclusionCode: EXCLUSION_CODE.INVALID_GROUP_OR_WORKING_GROUP 
      })
    ])
  );

  // get all experiment condition for user 12 with wrong workingGroup
  experimentConditionAssignments = await getAllExperimentCondition(experimentUsers[11].id, new UpgradeLogger());
  expect(experimentConditionAssignments).toHaveLength(0);

  // mark experiment point
  markedExperimentPoint = await markExperimentPoint(experimentUsers[11].id, experimentName, experimentPoint, condition, new UpgradeLogger());
  checkMarkExperimentPointForUser(
    markedExperimentPoint,
    experimentUsers[11].id,
    experimentName,
    experimentPoint,
    1
  );

  // the user should be excluded due to 'INVALID_GROUP_OR_WORKING_GROUP' exclusion code:
  individualExclusions = await checkService.getAllIndividualExclusion();
  expect(individualExclusions.length).toEqual(8);
  expect(individualExclusions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: experiments[0].id + "_" + experimentUsers[11].id,
        exclusionCode: EXCLUSION_CODE.INVALID_GROUP_OR_WORKING_GROUP 
      })
    ])
  );
}
