// to run: npx ts-node clientlibs/js/quickTestAdaptive.ts
//
// Manual smoke test for Thompson Sampling (adaptive) experiments end-to-end:
//   1. Creates a real experiment via the admin API (POST /experiments) and starts enrollment.
//   2. Simulates a batch of synthetic users each calling /v6/init -> /v6/assign -> /v6/mark ->
//      /v6/reward, the same sequence a real client would.
//   3. Prints the reward summary (GET /experiments/rewards/:id) -- the same data the frontend's
//      Reward Feedback card reads -- so you can watch "Pending rewards" cycle with batchSize and
//      "Algorithm in Effect" flip from Random Assignment to Thompson Sampling as warmupThreshold
//      is crossed, without opening a browser.
//   4. Deletes the experiment when done (see CLEANUP_AFTER_RUN below).
//
// Local dev only. See ADMIN_TOKEN below for why.

import axios, { AxiosError } from 'axios';
import UpgradeClient from './dist/node';

const URL = {
  // 3030 is the standard docker-compose port (see root CLAUDE.md); a git worktree set up via
  // /new-worktree auto-assigns its own port instead (check packages/backend/.env's APP_PORT) --
  // update this if you're running in a worktree.
  LOCAL: 'http://localhost:3030',
  ECS_QA: 'https://apps.qa-cli.net/upgrade-service',
  ECS_STAGING: 'https://apps.qa-cli.com/upgrade-service',
};

// -------------------------------------------------------------------------------------------
// Admin auth
// -------------------------------------------------------------------------------------------
// authorizationChecker.ts (packages/backend/src/auth/) bypasses real Google token validation
// for this exact string, attaching a dev admin user instead -- but only when the target
// server's GOOGLE_AUTH_TOKEN_REQUIRED env var is false (check packages/backend/.env; this is
// this worktree's current local setting, not a given for every environment). This will NOT
// work against a real deployed server. Value must match FAKE_DEV_CREDENTIAL in
// packages/types/src/User/index.ts -- hardcoded rather than imported from upgrade_types
// because this file runs directly under ts-node (see quickTest.ts), which doesn't resolve the
// upgrade_types path alias at runtime the way a webpack-built consumer does.
const ADMIN_TOKEN = 'fake-dev-user-google-credential';

// -------------------------------------------------------------------------------------------
// Config -- edit these to change what gets created/simulated
// -------------------------------------------------------------------------------------------
const hostUrl = URL.LOCAL;
const adminApiUrl = hostUrl + '/api';
const context = 'upgrade-internal';
const site = 'quicktest-adaptive-site';
const target = 'quicktest-adaptive-target';

// Adaptive algorithm parameters -- see packages/frontend .../thompson-sampling-helper.service.ts
// and the Reward Feedback card for how these show up in the UI.
const BATCH_SIZE = 3; // rewards buffered before posteriors update; watch "Pending rewards" cycle 0..batchSize-1
const WARMUP_THRESHOLD = 4; // reward-count gate before real TS sampling kicks in; watch "Algorithm in Effect" flip
const MINIMUM_DRAW_DIFFERENCE = 0;

const CONDITIONS = [
  { tempId: 'quicktest-cond-control', conditionCode: 'control', priorSuccess: 1, priorFailure: 1 },
  { tempId: 'quicktest-cond-variant', conditionCode: 'variant', priorSuccess: 1, priorFailure: 1 },
];

const NUM_SIMULATED_USERS = 10;
// Each simulated user's reward outcome. A fixed pattern by default so runs are reproducible --
// swap in `Math.random() < 0.7 ? 'SUCCESS' : 'FAILURE'` if you want noisy data instead.
function rewardForUser(index: number): 'SUCCESS' | 'FAILURE' {
  return index % 3 === 0 ? 'FAILURE' : 'SUCCESS';
}

const CLEANUP_AFTER_RUN = false; // delete the created experiment when the script finishes

// -------------------------------------------------------------------------------------------

const adminClient = axios.create({
  baseURL: adminApiUrl,
  headers: { Authorization: `Bearer ${ADMIN_TOKEN}` },
});

quickTestAdaptive();

/** main test *******************************************************************************/
async function quickTestAdaptive() {
  const experiment = await createAdaptiveExperiment();
  if (!experiment) return;

  console.log(`\n[Created experiment]: ${experiment.id} (${experiment.name})`);
  console.log(
    '[Conditions]:',
    experiment.conditions.map((c: { conditionCode: string; id: string }) => `${c.conditionCode}=${c.id}`).join(', ')
  );

  await setExperimentState(experiment.id, 'enrolling');
  console.log('[Experiment state]: enrolling');

  for (let i = 0; i < NUM_SIMULATED_USERS; i++) {
    await simulateUser(i, experiment.id);
  }

  // /v6/reward is fire-and-forget (POST /v6/reward acknowledges before the DB write happens --
  // see ThompsonSamplingRewardService.acceptReward()), so give the background processing a beat
  // to finish before reading the summary back, or the last few rewards may not show up yet.
  await sleep(1000);

  await printRewardsSummary(experiment.id);

  if (CLEANUP_AFTER_RUN) {
    await deleteExperiment(experiment.id);
    console.log(`\n[Cleaned up]: deleted experiment ${experiment.id}`);
  } else {
    console.log(`\n[Left in place]: experiment ${experiment.id} -- delete manually when done.`);
  }
}

/** admin API calls (experiment CRUD) *******************************************************/

async function createAdaptiveExperiment(): Promise<{
  id: string;
  name: string;
  conditions: { id: string; conditionCode: string }[];
} | null> {
  const payload = {
    name: `quicktest-adaptive-${Date.now()}`,
    description: 'Created by clientlibs/js/quickTestAdaptive.ts -- safe to delete.',
    context: [context],
    state: 'inactive',
    consistencyRule: 'individual',
    assignmentUnit: 'individual',
    postExperimentRule: 'continue',
    tags: ['quicktest'],
    filterMode: 'includeAll', // excludeAll would exclude every user unless individually/group included via a segment
    type: 'Simple',
    assignmentAlgorithm: 'thompson_sampling',
    // Conditions/partitions need a client-supplied id even though the server regenerates its
    // own -- ExperimentService.create() remaps thompsonSamplingConfig.priors from these ids onto
    // the server-generated ones automatically (see ThompsonSamplingExperimentCrudService).
    conditions: CONDITIONS.map((c, index) => ({
      id: c.tempId,
      name: c.conditionCode,
      description: '',
      conditionCode: c.conditionCode,
      assignmentWeight: 100 / CONDITIONS.length, // ignored for Thompson Sampling, but required by the DTO
      order: index + 1,
    })),
    partitions: [{ id: 'quicktest-adaptive-dp-1', site, target, description: '', order: 1, excludeIfReached: false }],
    thompsonSamplingConfig: {
      warmupThreshold: WARMUP_THRESHOLD,
      batchSize: BATCH_SIZE,
      minimumDrawDifference: MINIMUM_DRAW_DIFFERENCE,
      priors: Object.fromEntries(
        CONDITIONS.map((c) => [c.tempId, { success: c.priorSuccess, failure: c.priorFailure }])
      ),
    },
  };

  try {
    const response = await adminClient.post('/experiments', payload);
    return response.data;
  } catch (error) {
    logAxiosError('Create experiment', error);
    return null;
  }
}

async function setExperimentState(experimentId: string, state: string): Promise<void> {
  try {
    await adminClient.post('/experiments/state', { experimentId, state });
  } catch (error) {
    logAxiosError('Set experiment state', error);
  }
}

async function printRewardsSummary(experimentId: string): Promise<void> {
  try {
    const response = await adminClient.get(`/experiments/rewards/${experimentId}`);
    console.log('\n[Rewards summary]:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    logAxiosError('Rewards summary', error);
  }
}

async function deleteExperiment(experimentId: string): Promise<void> {
  try {
    await adminClient.delete(`/experiments/${experimentId}`);
  } catch (error) {
    logAxiosError('Delete experiment', error);
  }
}

/** simulated user flow (client SDK, same as a real client would call) **********************/

async function simulateUser(index: number, experimentId: string): Promise<void> {
  const userId = `quicktest_adaptive_user_${Date.now()}_${index}`;
  const client = new UpgradeClient(userId, hostUrl, context);

  try {
    await client.init();

    const assignment = await client.getDecisionPointAssignment(site, target);
    const condition = assignment.getCondition();
    await assignment.markDecisionPoint(UpgradeClient.MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);

    const rewardValue = rewardForUser(index);
    await client.sendReward({ rewardValue, experimentId });

    console.log(`[User ${index}]: condition=${condition} reward=${rewardValue}`);
  } catch (error) {
    logAxiosError(`User ${index}`, error);
  }
}

/** utility functions *************************************************************************/

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logAxiosError(functionContext: string, error: unknown): void {
  const axiosError = error as AxiosError;
  const data = axiosError?.response?.data;
  console.error(`\n[${functionContext} error]:`, data ?? axiosError?.message ?? error);
}
