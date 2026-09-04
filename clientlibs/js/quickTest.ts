// to run against the full (axios-bundled) build:  npx ts-node clientlibs/js/quickTest.ts
// to run against the "lite" build (BYO http client): npx ts-node clientlibs/js/quickTest.ts lite

import type { UpGradeClientInterfaces } from './dist/node';
import { FetchHttpClient } from './quickTestLiteHttpClient';

const variant = process.argv[2] === 'lite' ? 'lite' : 'node';
console.log(`\n[quickTest] running against the "${variant}" build\n`);

// dynamic require so the unused variant's bundle (and, for "node", its bundled axios) is never
// loaded -- that would defeat the point of smoke-testing "lite" in isolation.
// webpack's `libraryExport: 'default'` UMD setting makes the required module *be* the default
// export (the UpgradeClient class) directly, with MARKED_DECISION_POINT_STATUS/etc. reachable
// only as static properties on it -- there is no `.default` to unwrap.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const UpgradeClient = require(`./dist/${variant}`) as typeof import('./dist/node').default;
const { MARKED_DECISION_POINT_STATUS } = UpgradeClient;
type UpgradeClientInstance = InstanceType<typeof UpgradeClient>;

const URL = {
  LOCAL: 'http://localhost:3030',
  BEANSTALK_QA: 'https://upgradeapi.qa-cli.net',
  BEANSTALK_STAGING: 'https://upgradeapi.qa-cli.com',
  ECS_QA: 'https://apps.qa-cli.net/upgrade-service',
  ECS_STAGING: 'https://apps.qa-cli.com/upgrade-service',
};

const userId = 'quicktest_user_' + new Date().getTime();
const useEphemeralGroups = false;
const group = { classId: ['STORED_USER_GROUP'] };
const workingGroup = 'STORED_USER_GROUP';
const groupsForSession = { classId: ['EPHEMERAL_USER_GROUP'] };
const includeStoredUserGroups = true; // true to merge with stored user groups, false for session-only groups
const alias = 'alias' + userId;
const hostUrl = URL.LOCAL;
const context = 'assign-prog';
const site = 'fakesite';
const target = 'faketarget';
const status = MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED;
const featureFlagKey = 'TEST_FEATURE_FLAG';

// reward testing variables ----- //
const experimentId = '1a43d51e-b286-40a2-9dd7-a01b67797276'; // needed for reward testing
const rewardSite = site; // if using decision point for reward
const rewardTarget = target; // if using decision point for reward
const rewardValue = 'FAILURE'; // or 'FAILURE' or use an UpgradeClient.BINARY_REWARD_VALUE enum
// ---------------------------- //

const options: UpGradeClientInterfaces.IConfigOptions = {
  featureFlagUserGroupsForSession: useEphemeralGroups
    ? {
        groupsForSession,
        includeStoredUserGroups,
      }
    : null,
  // the "lite" build ships with no bundled http client and throws unless one is provided;
  // the "node"/"browser" builds throw if one *is* provided, since they own the default (axios) client
  httpClient: variant === 'lite' ? new FetchHttpClient() : undefined,
};

const logRequest = [
  {
    userId,
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

quickTest();

/** main test *******************************************************************************/
async function quickTest() {
  const client = new UpgradeClient(userId, hostUrl, context, options);
  await doInit(client);
  await doGroupMembership(client);
  await doWorkingGroupMembership(client);
  // await doAliases(client);
  // await doAssign(client);
  // await doAssignIgnoreCache(client);
  // await doAssign(client);
  const condition = await doGetDecisionPointAssignment(client);
  // doSetFeatureFlagUserGroupsForSession(client, options);
  // await doFeatureFlags(client);
  // await doFeatureFlagsIgnoreCache(client);
  // await doHasFeatureFlag(client);
  // await doHasFeatureFlag(client);
  await doMark(client, condition);
  // Use the created experiment ID for reward testing (optional)
  // await doSendRewardByExperimentId(client);
  await doSendRewardByDecisionPoint(client);
  // await doLog(client);
}

/** test functions *******************************************************************************/

async function doInit(client: UpgradeClientInstance) {
  try {
    const response = await client.init();
    console.log('\n[Init response]:', JSON.stringify(response));
  } catch (error) {
    logRequestError('Init', error);
  }
}

async function doGroupMembership(client: UpgradeClientInstance) {
  const groupRequest: UpGradeClientInterfaces.IExperimentUserGroup = group;

  try {
    const response = await client.setGroupMembership(groupRequest);
    console.log('\n[Group response]:', JSON.stringify(response));
  } catch (error) {
    logRequestError('Group', error);
  }
}

async function doWorkingGroupMembership(client: UpgradeClientInstance) {
  const workingGroupRequest: UpGradeClientInterfaces.IExperimentUserWorkingGroup = { workingGroup };
  try {
    const response = await client.setWorkingGroup(workingGroupRequest);
    console.log('\n[Working Group response]:', JSON.stringify(response));
  } catch (error) {
    logRequestError('Working Group', error);
  }
}

async function doAliases(client: UpgradeClientInstance) {
  const aliasRequest = [alias];
  try {
    const response = await client.setAltUserIds(aliasRequest);
    console.log('\n[Aliases response]:', JSON.stringify(response));
  } catch (error) {
    logRequestError('Aliases', error);
  }
}

async function doAssign(client: UpgradeClientInstance) {
  try {
    const response = await client.getAllExperimentConditions();
    console.log('\n[Assign response]:', JSON.stringify(response));
  } catch (error) {
    logRequestError('Assign', error);
  }
}

async function doAssignIgnoreCache(client: UpgradeClientInstance) {
  try {
    const response = await client.getAllExperimentConditions({ ignoreCache: true });
    console.log('\n[Assign response]:', JSON.stringify(response));
  } catch (error) {
    logRequestError('Assign', error);
  }
}

async function doGetDecisionPointAssignment(client: UpgradeClientInstance): Promise<string | null> {
  try {
    const response = await client.getDecisionPointAssignment(site, target);
    console.log('\n[Decision Point Assignment response]:', JSON.stringify(response));

    const condition = response.getCondition();
    console.log('\n[Condition]:', JSON.stringify(condition));

    const expType = response.getExperimentType();
    console.log('\n[Experiment Type]:', JSON.stringify(expType));

    const payload = response.getPayload();
    console.log('\n[Payload]:', JSON.stringify(payload));

    const payloadValue = payload?.value;
    console.log('\n[payloadValue]:', JSON.stringify(payloadValue));
    return condition;
  } catch (error) {
    logRequestError('Decision Point Assignment', error);
    return null;
  }
}

// to test this function, omit passing options to constructor
function doSetFeatureFlagUserGroupsForSession(
  client: UpgradeClientInstance,
  options: UpGradeClientInterfaces.IConfigOptions | null | undefined
) {
  client.setFeatureFlagUserGroupsForSession(options?.featureFlagUserGroupsForSession);
}

async function doFeatureFlags(client: UpgradeClientInstance) {
  try {
    const response = await client.getAllFeatureFlags();
    console.log('\n[Feature Flag response]:', JSON.stringify(response));
  } catch (error) {
    logRequestError('Feature Flag', error);
  }
}

async function doFeatureFlagsIgnoreCache(client: UpgradeClientInstance) {
  try {
    const response = await client.getAllFeatureFlags({ ignoreCache: true });
    console.log('\n[Feature Flag response]:', JSON.stringify(response));
  } catch (error) {
    logRequestError('Feature Flag', error);
  }
}

async function doHasFeatureFlag(client: UpgradeClientInstance) {
  try {
    const response = await client.hasFeatureFlag(featureFlagKey);
    console.log('\n[Has Feature Flag response]:', response);
  } catch (error) {
    logRequestError('Has Feature Flag', error);
  }
}

async function doMark(client: UpgradeClientInstance, condition: string | null) {
  try {
    const response = await client.markDecisionPoint(site, target, condition, status);
    console.log('\n[Mark response]:', JSON.stringify(response));
  } catch (error) {
    logRequestError('Mark', error);
  }
}

async function doLog(client: UpgradeClientInstance) {
  try {
    const response = await client.log(logRequest);
    console.log('\n[Log response]:', JSON.stringify(response));
  } catch (error) {
    logRequestError('Log', error);
  }
}

async function doSendRewardByExperimentId(client: UpgradeClientInstance) {
  try {
    const response = await client.sendReward({
      rewardValue,
      experimentId,
    });
    console.log('\n[Send Reward by ExperimentId response]:', JSON.stringify(response));
  } catch (error) {
    logRequestError('Send Reward by ExperimentId', error);
  }
}

async function doSendRewardByDecisionPoint(client: UpgradeClientInstance) {
  try {
    const response = await client.sendReward({
      rewardValue,
      context,
      decisionPoint: {
        site: rewardSite,
        target: rewardTarget,
      },
    });
    console.log('\n[Send Reward by Decision Point response]:', JSON.stringify(response));
  } catch (error) {
    logRequestError('Send Reward by Decision Point', error);
  }
}

/** utility functions *******************************************************************************/

// handles error shapes from both the default (axios-backed) http client and the fetch-based
// one used to smoke-test the "lite" build in quickTestLiteHttpClient.ts
function logRequestError(functionContext: string, error: unknown) {
  const err = error as Error;
  try {
    const parsedError = JSON.parse(err.message);

    console.error(`\n[${functionContext} error]:`, {
      status: parsedError.status ?? parsedError.statusCode,
      request: parsedError.config?.data ?? parsedError.response,
      message: parsedError.message ?? err.message,
      stack: err.stack,
    });
  } catch {
    console.error(`\n[${functionContext} error]:`, error);
  }
}
