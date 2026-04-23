import { Container } from 'typedi';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user/index';
import { experimentUsers } from '../../mockData/experimentUsers';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { getAllExperimentCondition, markExperimentPoint, checkMarkExperimentPointForUser } from '../../utils';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { individualAssignmentExperiment, allNullTargetPartitionsExperiment } from '../../mockData/experiment/index';

/**
 * Verifies that an experiment with a mix of null-target and non-null-target decision points:
 * - stores the null-target partition correctly (target IS NULL in DB)
 * - includes the null-target partition in getAllExperimentConditions results
 * - accepts markExperimentPoint calls with no target and records the monitored point
 */
export async function NullTargetMixedDecisionPoint(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);

  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // individualAssignmentExperiment has W1, W2 (non-null target) and NP (null target) partitions
  const experimentObject = individualAssignmentExperiment;
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());

  // The null-target (NP) partition should be stored with target IS NULL
  const nullTargetPartition = experiments[0].partitions.find((p) => !p.target);
  expect(nullTargetPartition).toBeDefined();
  expect(nullTargetPartition.site).toEqual('CurriculumSequence');
  expect(nullTargetPartition.target).toBeNull();

  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.RUNNING, user, new UpgradeLogger());

  // getAllExperimentConditions should include the null-target DP as a separate assignment entry
  const assignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  const nullTargetAssignment = assignments.find((a) => a.target == null && a.site === 'CurriculumSequence');
  expect(nullTargetAssignment).toBeDefined();
  expect(nullTargetAssignment.assignedCondition).toBeDefined();
  expect(nullTargetAssignment.assignedCondition.length).toBeGreaterThan(0);

  // markExperimentPoint with undefined target should record a monitored point with null target
  const condition = experimentObject.conditions[0].conditionCode;
  const markedPoint = await markExperimentPoint(
    experimentUsers[0].id,
    undefined,
    'CurriculumSequence',
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedPoint, experimentUsers[0].id, null, 'CurriculumSequence');
}

/**
 * Verifies that an experiment where ALL decision points have null target works end-to-end:
 * - all partitions are stored with target IS NULL
 * - getAllExperimentConditions returns only null-target assignment entries
 * - markExperimentPoint with no target records the monitored point correctly
 */
export async function NullTargetAllDecisionPoints(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);

  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  const experimentObject = allNullTargetPartitionsExperiment;
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  const experiments = await experimentService.find(new UpgradeLogger());

  // Every partition should have null target
  expect(experiments[0].partitions.length).toBeGreaterThan(0);
  experiments[0].partitions.forEach((p) => {
    expect(p.target).toBeNull();
  });

  const experimentId = experiments[0].id;
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.RUNNING, user, new UpgradeLogger());

  // getAllExperimentConditions should return an entry per null-target partition
  const assignments = await getAllExperimentCondition(experimentUsers[0].id, new UpgradeLogger());
  expect(assignments.length).toEqual(experimentObject.partitions.length);
  assignments.forEach((assignment) => {
    expect(assignment.target).toBeNull();
    expect(assignment.site).toEqual('CurriculumSequence');
    expect(assignment.assignedCondition.length).toBeGreaterThan(0);
  });

  // markExperimentPoint with undefined target should work and record null target
  const condition = experimentObject.conditions[0].conditionCode;
  const markedPoint = await markExperimentPoint(
    experimentUsers[0].id,
    undefined,
    'CurriculumSequence',
    condition,
    experimentId,
    new UpgradeLogger()
  );
  checkMarkExperimentPointForUser(markedPoint, experimentUsers[0].id, null, 'CurriculumSequence');
}
