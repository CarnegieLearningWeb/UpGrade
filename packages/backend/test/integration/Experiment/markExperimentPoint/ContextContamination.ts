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
 * Phase 7b — Context contamination test
 *
 * Verifies that getCachedValidExperiments(context) scopes the experiment pool to the given
 * context before any filtering.  Before this fix, DecisionPointRepository.find({ where: { site, target } })
 * had no context dimension — both experiments A and B would appear in the pool for any mark at the
 * shared decision point, and the wrong experiment could be selected.  After the fix, the context
 * parameter is first-class: marking in context "math" only sees experiment A, and marking in
 * context "science" only sees experiment B.
 *
 * Setup:
 *   Experiment A — context="math",    site="homepage", target="button"
 *   Experiment B — context="science", site="homepage", target="button"
 *
 * Assert:
 *   user1 marks in context "math"    → monitored point experimentId === experiment A's id
 *   user2 marks in context "science" → monitored point experimentId === experiment B's id
 */
export default async function ContextContamination(): Promise<void> {
  const experimentService = Container.get<ExperimentService>(ExperimentService);
  const userService = Container.get<UserService>(UserService);
  const checkService = Container.get<CheckService>(CheckService);

  const user = await userService.upsertUser(systemUser as any, new UpgradeLogger());

  const contextMath = 'add';
  const contextScience = 'mul';
  // Both experiments share the same decision point — this is what makes contamination possible
  // without context-scoped caching.
  const sharedSite = 'homepage';
  const sharedTarget = 'button';

  // Experiment A — context "math"
  const experimentA = structuredClone(individualAssignmentExperiment);
  experimentA.id = 'aabb0000-0000-0000-0000-000000000001';
  experimentA.context = [contextMath];
  experimentA.partitions = [
    {
      ...experimentA.partitions[0],
      id: 'aabb0000-0000-0000-0000-000000000002',
      site: sharedSite,
      target: sharedTarget,
      twoCharacterId: 'MA',
    },
  ];
  experimentA.conditions = [
    { ...experimentA.conditions[0], id: 'aabb0000-0000-0000-0000-000000000003' },
    { ...experimentA.conditions[1], id: 'aabb0000-0000-0000-0000-000000000004' },
  ];
  experimentA.conditionPayloads = [];

  // Experiment B — context "science", same site/target as A
  const experimentB = structuredClone(individualAssignmentExperiment);
  experimentB.id = 'bbcc0000-0000-0000-0000-000000000001';
  experimentB.context = [contextScience];
  experimentB.partitions = [
    {
      ...experimentB.partitions[0],
      id: 'bbcc0000-0000-0000-0000-000000000002',
      site: sharedSite,
      target: sharedTarget,
      twoCharacterId: 'SC',
    },
  ];
  experimentB.conditions = [
    { ...experimentB.conditions[0], id: 'bbcc0000-0000-0000-0000-000000000005' },
    { ...experimentB.conditions[1], id: 'bbcc0000-0000-0000-0000-000000000006' },
  ];
  experimentB.conditionPayloads = [];

  // 1. Create and activate both experiments
  await experimentService.create(experimentA as any, user, new UpgradeLogger());
  await experimentService.create(experimentB as any, user, new UpgradeLogger());

  await experimentService.updateState(experimentA.id, EXPERIMENT_STATE.RUNNING, user, new UpgradeLogger());
  await experimentService.updateState(experimentB.id, EXPERIMENT_STATE.RUNNING, user, new UpgradeLogger());

  // 2. Assign each user in their respective context so the cache is warm and enrollments exist.
  //    experimentUsers[1] = student2 (student1 is excluded by the mock experiment's segmentExclusion rule).
  //    experimentUsers[2] = student3
  const conditionsMath = await getAllExperimentCondition(experimentUsers[1].id, new UpgradeLogger(), contextMath);
  expect(conditionsMath.filter((c) => c.site === sharedSite && c.target === sharedTarget).length).toEqual(1);

  const conditionsScience = await getAllExperimentCondition(experimentUsers[2].id, new UpgradeLogger(), contextScience);
  expect(conditionsScience.filter((c) => c.site === sharedSite && c.target === sharedTarget).length).toEqual(1);

  // 3. Mark user1 in context "math" — resolveExperimentForMarkPoint must return only experiment A.
  //    Pass null for condition and experimentId so the service resolves the experiment by context/site/target.
  await markExperimentPoint(
    experimentUsers[1].id,
    sharedTarget,
    sharedSite,
    null,
    null,
    new UpgradeLogger(),
    contextMath
  );

  // The monitored decision point for user1 must reference experiment A, not experiment B.
  let markedPoints = await checkService.getAllMarkedExperimentPoints();
  const markForUser1 = markedPoints.find(
    (mp) => mp.site === sharedSite && mp.target === sharedTarget && mp.user.id === experimentUsers[1].id
  );
  expect(markForUser1).toBeDefined();
  expect(markForUser1.experimentId).toEqual(experimentA.id);

  // 4. Mark user2 in context "science" — resolveExperimentForMarkPoint must return only experiment B.
  await markExperimentPoint(
    experimentUsers[2].id,
    sharedTarget,
    sharedSite,
    null,
    null,
    new UpgradeLogger(),
    contextScience
  );

  markedPoints = await checkService.getAllMarkedExperimentPoints();
  const markForUser2 = markedPoints.find(
    (mp) => mp.site === sharedSite && mp.target === sharedTarget && mp.user.id === experimentUsers[2].id
  );
  expect(markForUser2).toBeDefined();
  expect(markForUser2.experimentId).toEqual(experimentB.id);
}
