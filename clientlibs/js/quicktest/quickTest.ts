// ---------------------------------------------------------------------------
// Usage:
//   yarn quicktest                                    # local, 1 run
//   yarn quicktest --config ecs-qa                   # QA config, 1 run
//   yarn quicktest --setup                           # create experiment, then run
//   yarn quicktest --teardown                        # delete experiment
//   yarn quicktest --wizard                          # launch interactive config wizard
//   yarn quicktest --build                           # force rebuild before running
//   yarn quicktest --no-log                          # skip writing a run log
//
// For multi-step sequences, use the looper: yarn looper --looper <name>
//
// Each run writes a log to quicktest/runlogs/<timestamp>_<config>.log (pass --no-log to skip).
// If dist/node does not exist, the build runs automatically. Use --build to force a rebuild.
// Config files live in quicktest/tests/. Copy default-local.quicktest to create your own.
// Only default-local.quicktest is committed; all others are gitignored.
// ---------------------------------------------------------------------------

import axios, { AxiosError } from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { parseArgs } from 'util';
import UpgradeClient, { MARKED_DECISION_POINT_STATUS, UpGradeClientInterfaces } from '../dist/node';
import { runWizard } from './wizard';

/** CLI args */
const { values: args } = parseArgs({
  args: process.argv.slice(2),
  options: {
    config: { type: 'string', default: 'default-local' },
    setup: { type: 'boolean', default: false },
    teardown: { type: 'boolean', default: false },
    wizard: { type: 'boolean', default: false },
    'no-log': { type: 'boolean', default: false },
  },
});

/** Load config file into cfg — does not pollute process.env. Skipped in wizard mode. */
const configName = args.config as string;
const configFilePath = path.resolve(__dirname, 'tests', `${configName}.quicktest`);

if (!args.wizard) {
  if (!fs.existsSync(configFilePath)) {
    console.error(`\n[Config] Config file not found: ${configFilePath}`);
    console.error('[Config] Copy quicktest/tests/default-local.quicktest to create your own.\n');
    process.exit(1);
  }
  console.log(`\n[Config] config=${configName} | host=${dotenv.parse(fs.readFileSync(configFilePath)).HOST_URL}`);
}

const cfg = fs.existsSync(configFilePath) ? dotenv.parse(fs.readFileSync(configFilePath)) : {};

/** Run log — tees all console output to runlogs/<timestamp>_<config>.log unless --no-log is set */
if (!args['no-log'] && !args.wizard && fs.existsSync(configFilePath)) {
  const runlogsDir = path.resolve(__dirname, 'runlogs');
  if (!fs.existsSync(runlogsDir)) fs.mkdirSync(runlogsDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const logPath = path.join(runlogsDir, `${timestamp}_${configName}.log`);
  const logStream = fs.createWriteStream(logPath);

  const configLines = fs
    .readFileSync(configFilePath, 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .join('\n');
  logStream.write(`=== Config: ${configName} ===\n${configLines}\n\n=== Output ===\n`);

  const tee =
    (orig: (...a: unknown[]) => void) =>
    (...args: unknown[]) => {
      orig(...args);
      logStream.write(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a, null, 2))).join(' ') + '\n');
    };
  console.log = tee(console.log.bind(console)) as typeof console.log;
  console.warn = tee(console.warn.bind(console)) as typeof console.warn;
  console.error = tee(console.error.bind(console)) as typeof console.error;

  console.log(`[Log] ${logPath}`);
}

/** Sample log data */
const logRequest = [
  {
    timestamp: '2022-03-03T19:49:00.496',
    metrics: {
      attributes: {
        totalTimeSeconds: 41834,
        totalMasteryWorkspacesCompleted: 15,
        totalConceptBuildersCompleted: 17,
        totalMasteryWorkspacesGraduated: 15,
        totalSessions: 50,
        totalProblemsCompleted: 249,
      },
      groupedMetrics: [
        {
          groupClass: 'conceptBuilderWorkspace',
          groupKey: 'graphs_of_functions',
          groupUniquifier: '2022-02-03T19:48:53.861Z',
          attributes: {
            timeSeconds: 488,
            hintCount: 2,
            errorCount: 15,
            completionCount: 1,
            workspaceCompletionStatus: 'GRADUATED',
            problemsCompleted: 4,
          },
        },
      ],
    },
  },
];

/** Entry point *******************************************************************************/

(async () => {
  if (args.wizard) {
    await runWizard();
    return;
  }

  if (args.teardown) {
    await teardown();
  } else {
    if (args.setup || cfg.SETUP === 'true') {
      const createdId = await setup();
      if (createdId) cfg.EXPERIMENT_ID = createdId;
    }
    await runOnce(resolveUserId());
  }
})();

/** user ID resolution *******************************************************************************/

function resolveUserId(): string {
  const mode = cfg.USER_ID_MODE;
  if (mode === 'SPECIFIED_USER_SAME_ALL_LOOPS') {
    if (!cfg.USER_ID) {
      console.error('[UserId] USER_ID_MODE is SPECIFIED_USER_SAME_ALL_LOOPS but USER_ID is not set in config.');
      process.exit(1);
    }
    return cfg.USER_ID;
  }
  return 'quicktest_user_' + Date.now();
}

/** main test *******************************************************************************/

async function runOnce(runUserId: string) {
  const client = new UpgradeClient(runUserId, cfg.HOST_URL, cfg.CONTEXT, {});
  const scriptFns = cfg.SCRIPT
    ? cfg.SCRIPT.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [
        'doInit',
        'doGroupMembership',
        'doWorkingGroupMembership',
        'doGetDecisionPointAssignment',
        'doMark',
        'doSendRewardByDecisionPoint',
      ];

  let condition: string | null = null;
  for (const fn of scriptFns) {
    switch (fn) {
      case 'doInit':
        await doInit(client);
        break;
      case 'doGroupMembership':
        await doGroupMembership(client);
        break;
      case 'doWorkingGroupMembership':
        await doWorkingGroupMembership(client);
        break;
      case 'doAliases':
        await doAliases(client, runUserId);
        break;
      case 'doAssignIgnoreCache':
        await doAssignIgnoreCache(client);
        break;
      case 'doGetDecisionPointAssignment':
        condition = await doGetDecisionPointAssignment(client);
        break;
      case 'doMark':
        await doMark(client, condition);
        break;
      case 'doLog':
        await doLog(client);
        break;
      case 'doSendRewardByExperimentId':
        await doSendRewardByExperimentId(client);
        break;
      case 'doSendRewardByDecisionPoint':
        await doSendRewardByDecisionPoint(client);
        break;
      case 'doAssign':
        await doAssign(client);
        break;
      case 'doFeatureFlags':
        await doFeatureFlags(client);
        break;
      case 'doFeatureFlagsIgnoreCache':
        await doFeatureFlagsIgnoreCache(client);
        break;
      case 'doHasFeatureFlag':
        await doHasFeatureFlag(client);
        break;
      case 'doSetFeatureFlagUserGroupsForSession':
        doSetFeatureFlagUserGroupsForSession(client);
        break;
      default:
        console.warn(`[Script] Unknown function: "${fn}" — skipping`);
        break;
    }
  }
}

/** setup / teardown *******************************************************************************/

async function setup(): Promise<string | null> {
  console.log('\n[Setup] Creating quicktest experiment...');
  try {
    const response = await axios.post(
      `${cfg.HOST_URL}/api/experiments`,
      {
        name: 'quicktest-experiment',
        context: [cfg.CONTEXT],
        state: 'enrolling',
        assignmentUnit: 'individual',
        consistencyRule: 'individual',
        postExperimentRule: 'continue',
        filterMode: 'includeAll',
        type: 'Simple',
        tags: ['quicktest'],
        conditions: [
          { conditionCode: 'control', assignmentWeight: 50, description: '' },
          { conditionCode: 'treatment', assignmentWeight: 50, description: '' },
        ],
        partitions: [{ site: cfg.SITE, target: cfg.TARGET, excludeIfReached: false }],
      },
      buildAuthHeader()
    );
    const id = response.data?.id;
    console.log(`[Setup] Experiment created. ID: ${id}`);
    console.log('[Setup] To reuse across sessions, set EXPERIMENT_ID in your env file.');
    return id ?? null;
  } catch (error) {
    console.warn('\n[Setup] Failed. Auth may be required for this environment.');
    logAxiosError('Setup', error);
    return null;
  }
}

async function teardown() {
  if (!cfg.EXPERIMENT_ID) {
    console.error('[Teardown] EXPERIMENT_ID not set in env file. Nothing to delete.');
    process.exit(1);
  }
  console.log(`\n[Teardown] Deleting experiment ${cfg.EXPERIMENT_ID}...`);
  try {
    await axios.delete(`${cfg.HOST_URL}/api/experiments/${cfg.EXPERIMENT_ID}`, buildAuthHeader());
    console.log('[Teardown] Done.');
  } catch (error) {
    console.warn('[Teardown] Failed. Auth may be required for this environment.');
    logAxiosError('Teardown', error);
  }
}

function buildAuthHeader(): { headers: Record<string, string> } | Record<string, never> {
  return cfg.ADMIN_API_TOKEN ? { headers: { Authorization: `Bearer ${cfg.ADMIN_API_TOKEN}` } } : {};
}

/** test functions *******************************************************************************/

async function doInit(client: UpgradeClient) {
  try {
    const response = await client.init();
    console.log('\n[Init response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Init', error);
  }
}

function parseUserGroups(raw: string): Record<string, string[]> {
  if (!raw) return {};
  return Object.fromEntries(
    raw
      .split(';')
      .filter(Boolean)
      .map((entry) => {
        const colonIdx = entry.indexOf(':');
        const type = entry.slice(0, colonIdx);
        const ids = entry
          .slice(colonIdx + 1)
          .split(',')
          .filter(Boolean);
        return [type, ids];
      })
  );
}

async function doGroupMembership(client: UpgradeClient) {
  // Prefer USER_GROUPS (wizard format); fall back to GROUP_CLASS/GROUP_VALUE (legacy format)
  let group: UpGradeClientInterfaces.IExperimentUserGroup;
  if (cfg.USER_GROUPS) {
    group = parseUserGroups(cfg.USER_GROUPS);
  } else if (cfg.GROUP_CLASS && cfg.GROUP_VALUE) {
    group = { [cfg.GROUP_CLASS]: [cfg.GROUP_VALUE] };
  } else {
    console.warn('\n[Group] Skipped: no USER_GROUPS or GROUP_CLASS/GROUP_VALUE set in config.');
    return;
  }
  try {
    const response = await client.setGroupMembership(group);
    console.log('\n[Group response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Group', error);
  }
}

async function doWorkingGroupMembership(client: UpgradeClient) {
  // setWorkingGroup takes Record<string, string> directly — { groupType: groupId }
  let workingGroup: UpGradeClientInterfaces.IExperimentUserWorkingGroup;
  if (cfg.WORKING_GROUP_TYPE && cfg.WORKING_GROUP_ID) {
    workingGroup = { [cfg.WORKING_GROUP_TYPE]: cfg.WORKING_GROUP_ID };
  } else {
    console.warn('\n[Working Group] Skipped: no WORKING_GROUP_TYPE/WORKING_GROUP_ID set in config.');
    return;
  }
  try {
    const response = await client.setWorkingGroup(workingGroup);
    console.log('\n[Working Group response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Working Group', error);
  }
}

async function doAliases(client: UpgradeClient, runUserId: string) {
  try {
    const response = await client.setAltUserIds(['alias' + runUserId]);
    console.log('\n[Aliases response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Aliases', error);
  }
}

async function doAssign(client: UpgradeClient) {
  try {
    const response = await client.getAllExperimentConditions();
    console.log('\n[Assign response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Assign', error);
  }
}

async function doAssignIgnoreCache(client: UpgradeClient) {
  try {
    const response = await client.getAllExperimentConditions({ ignoreCache: true });
    console.log('\n[Assign (ignore cache) response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Assign (ignore cache)', error);
  }
}

async function doGetDecisionPointAssignment(client: UpgradeClient): Promise<string | null> {
  try {
    const response = await client.getDecisionPointAssignment(cfg.SITE, cfg.TARGET);
    console.log('\n[Decision Point Assignment response]:', await client.getAllExperimentConditions());

    const condition = response.getCondition();
    console.log('\n[Condition]:', JSON.stringify(condition));

    const expType = response.getExperimentType();
    console.log('\n[Experiment Type]:', JSON.stringify(expType));

    const payload = response.getPayload();
    console.log('\n[Payload]:', JSON.stringify(payload));
    console.log('\n[payloadValue]:', JSON.stringify(payload?.value));

    return condition;
  } catch (error) {
    logAxiosError('Decision Point Assignment', error);
    return null;
  }
}

function doSetFeatureFlagUserGroupsForSession(
  client: UpgradeClient,
  options?: UpGradeClientInterfaces.IConfigOptions | null
) {
  client.setFeatureFlagUserGroupsForSession(options?.featureFlagUserGroupsForSession);
}

async function doFeatureFlags(client: UpgradeClient) {
  try {
    const response = await client.getAllFeatureFlags();
    console.log('\n[Feature Flag response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Feature Flag', error);
  }
}

async function doFeatureFlagsIgnoreCache(client: UpgradeClient) {
  try {
    const response = await client.getAllFeatureFlags({ ignoreCache: true });
    console.log('\n[Feature Flag (ignore cache) response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Feature Flag (ignore cache)', error);
  }
}

async function doHasFeatureFlag(client: UpgradeClient) {
  try {
    const response = await client.hasFeatureFlag(cfg.FEATURE_FLAG_KEY);
    console.log('\n[Has Feature Flag response]:', response);
  } catch (error) {
    logAxiosError('Has Feature Flag', error);
  }
}

async function doMark(client: UpgradeClient, condition: string | null) {
  try {
    const response = await client.markDecisionPoint(
      cfg.SITE,
      cfg.TARGET,
      condition,
      MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
    );
    console.log('\n[Mark response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Mark', error);
  }
}

async function doLog(client: UpgradeClient) {
  try {
    const response = await client.log(logRequest);
    console.log('\n[Log response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Log', error);
  }
}

async function doSendRewardByExperimentId(client: UpgradeClient) {
  if (!cfg.EXPERIMENT_ID) {
    console.warn('\n[Send Reward by ExperimentId] Skipped: EXPERIMENT_ID not set in env file.');
    return;
  }
  try {
    const response = await client.sendReward({
      rewardValue: cfg.REWARD_VALUE as 'SUCCESS' | 'FAILURE',
      experimentId: cfg.EXPERIMENT_ID,
    });
    console.log('\n[Send Reward by ExperimentId response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Send Reward by ExperimentId', error);
  }
}

async function doSendRewardByDecisionPoint(client: UpgradeClient) {
  try {
    const response = await client.sendReward({
      rewardValue: cfg.REWARD_VALUE as 'SUCCESS' | 'FAILURE',
      context: cfg.CONTEXT,
      decisionPoint: { site: cfg.SITE, target: cfg.TARGET },
    });
    console.log('\n[Send Reward by Decision Point response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Send Reward by Decision Point', error);
  }
}

/** utility functions *******************************************************************************/

function logAxiosError(functionContext: string, error: unknown) {
  const axiosError = error as AxiosError;
  try {
    const parsedError = JSON.parse(axiosError.message);
    console.error(`\n[${functionContext} error]:`, {
      status: parsedError.status,
      request: parsedError.config?.data,
      message: parsedError.message,
      stack: parsedError.stack,
    });
  } catch {
    console.error(`\n[${functionContext} error]:`, error);
  }
}
