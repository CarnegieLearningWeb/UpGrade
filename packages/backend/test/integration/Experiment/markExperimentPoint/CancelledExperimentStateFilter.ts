import { individualAssignmentExperiment } from '../../mockData/experiment/index';
import { ExperimentService } from '../../../../src/api/services/ExperimentService';
import { Container } from 'typedi';
import { UserService } from '../../../../src/api/services/UserService';
import { systemUser } from '../../mockData/user';
import { experimentUsers } from '../../mockData/experimentUsers';
import { EXPERIMENT_STATE } from 'upgrade_types';
import { getAllExperimentCondition, markExperimentPoint } from '../../utils';
import { UpgradeLogger } from '../../../../src/lib/logger/UpgradeLogger';
import { CheckService } from '../../../../src/api/services/CheckService';

/**
 * Phase 7a — State filter test
 *
 * Verifies that getCachedValidExperiments (used by resolveExperimentForMarkPoint) filters out
 * CANCELLED experiments.  Before this fix, DecisionPointRepository.find() returned experiments
 * in any state, so a cancelled experiment could appear in the mark result and get recorded as
 * the experimentId on the MonitoredDecisionPoint.  After the fix, only ENROLLING /
 * ENROLLMENT_COMPLETE experiments are considered, so marking at a decision point with no active
 * experiment records a null experimentId and creates no individual enrollment.
 */
export default async function CancelledExperimentStateFilter(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const checkService = Container.get<CheckService>(CheckService);

  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  // Use a fresh clone so mutations don't bleed into other tests
  const experimentObject = structuredClone(individualAssignmentExperiment);
  const context = experimentObject.context[0];
  const site = experimentObject.partitions[0].site;
  const target = experimentObject.partitions[0].target;

  // 1. Create experiment and transition to ENROLLING (RUNNING).
  // experimentUsers[1] (student2) is used for assign checks — student1 is excluded by the mock
  // experiment's segmentExclusion rule, so student2 is the first non-excluded user.
  await experimentService.create(experimentObject as any, user, new UpgradeLogger());
  let experiments = await experimentService.find(new UpgradeLogger());
  const experimentId = experiments[0].id;

  await experimentService.updateState(experimentId, EXPERIMENT_STATE.RUNNING, user, new UpgradeLogger());

  experiments = await experimentService.find(new UpgradeLogger());
  // ENROLLING is stored internally; find() applies the display-name override → RUNNING
  expect(experiments[0].state).toEqual(EXPERIMENT_STATE.RUNNING);

  // Confirm the experiment is visible to the assign path while active
  const conditionsWhileActive = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger(), context);
  expect(conditionsWhileActive).toEqual(expect.arrayContaining([expect.objectContaining({ site, target })]));

  // 2. Cancel the experiment — updateState clears the experiment cache for the context.
  // CANCELLED has no internal-name override, so it is stored as-is.
  // find() applies the display-name override CANCELLED → COMPLETED.
  await experimentService.updateState(experimentId, EXPERIMENT_STATE.CANCELLED, user, new UpgradeLogger());

  experiments = await experimentService.find(new UpgradeLogger());
  expect(experiments[0].state).toEqual(EXPERIMENT_STATE.COMPLETED);

  // Confirm the assign path no longer sees the experiment after cancellation
  const conditionsAfterCancel = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger(), context);
  expect(conditionsAfterCancel).not.toEqual(expect.arrayContaining([expect.objectContaining({ site, target })]));

  // 3. Mark the decision point without an experimentId so the service resolves it.
  // getCachedValidExperiments only returns ENROLLING / ENROLLMENT_COMPLETE experiments, so the
  // cancelled experiment is not found and the monitored point records no experiment reference.
  await markExperimentPoint(experimentUsers[1].id, target, site, null, null, new UpgradeLogger(), context);

  // No individual enrollment should be created — the cancelled experiment was filtered out
  const individualAssignments = await checkService.getAllIndividualAssignment();
  expect(individualAssignments.length).toEqual(0);

  // The monitored decision point is still written (mark always logs),
  // but with no experiment linked because the state filter excluded the cancelled experiment
  const markedPoints = await checkService.getAllMarkedExperimentPoints();
  expect(markedPoints.length).toBeGreaterThan(0);

  const markedPoint = markedPoints.find((mp) => mp.site === site && mp.target === target);
  expect(markedPoint).toBeDefined();
  expect(markedPoint.experimentId).toBeNull();
}
