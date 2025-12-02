// to run: npx ts-node clientlibs/js/quickTest.ts

import { AxiosError } from 'axios';
import UpgradeClient, { MARKED_DECISION_POINT_STATUS, UpGradeClientInterfaces } from './dist/node';

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
const context = 'upgrade-internal';
const site = 'asdf';
const target = 'fssfs';
const status = MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED;
const featureFlagKey = 'TEST_FEATURE_FLAG';

// reward testing variables ----- //
const experimentId = 'f9c3927c-b786-45f5-a96c-dd9262e3b4b6'; // needed for reward testing
const rewardSite = site; // if using decision point for reward
const rewardTarget = target; // if using decision point for reward
const rewardValue = 'SUCCESS'; // or 'FAILURE' or use an UpgradeClient.BINARY_REWARD_VALUE enum
// ---------------------------- //

const options: UpGradeClientInterfaces.IConfigOptions = {
  featureFlagUserGroupsForSession: useEphemeralGroups
    ? {
        groupsForSession,
        includeStoredUserGroups,
      }
    : null,
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
  await doAliases(client);
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

async function doInit(client: UpgradeClient) {
  try {
    const response = await client.init();
    console.log('\n[Init response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Init', error);
  }
}

async function doGroupMembership(client: UpgradeClient) {
  const groupRequest: UpGradeClientInterfaces.IExperimentUserGroup = group;

  try {
    const response = await client.setGroupMembership(groupRequest);
    console.log('\n[Group response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Group', error);
  }
}

async function doWorkingGroupMembership(client: UpgradeClient) {
  const workingGroupRequest: UpGradeClientInterfaces.IExperimentUserWorkingGroup = { workingGroup };
  try {
    const response = await client.setWorkingGroup(workingGroupRequest);
    console.log('\n[Working Group response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Working Group', error);
  }
}

async function doAliases(client: UpgradeClient) {
  const aliasRequest = [alias];
  try {
    const response = await client.setAltUserIds(aliasRequest);
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
    console.log('\n[Assign response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Assign', error);
  }
}

async function doGetDecisionPointAssignment(client: UpgradeClient): Promise<string | null> {
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
    logAxiosError('Decision Point Assignment', error);
    return null;
  }
}

// to test this function, omit passing options to constructor
function doSetFeatureFlagUserGroupsForSession(
  client: UpgradeClient,
  options: UpGradeClientInterfaces.IConfigOptions | null | undefined
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
    console.log('\n[Feature Flag response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Feature Flag', error);
  }
}

async function doHasFeatureFlag(client: UpgradeClient) {
  try {
    const response = await client.hasFeatureFlag(featureFlagKey);
    console.log('\n[Has Feature Flag response]:', response);
  } catch (error) {
    logAxiosError('Has Feature Flag', error);
  }
}

async function doMark(client: UpgradeClient, condition: string | null) {
  try {
    const response = await client.markDecisionPoint(site, target, condition, status);
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
  try {
    const response = await client.sendReward({
      rewardValue,
      experimentId,
    });
    console.log('\n[Send Reward by ExperimentId response]:', JSON.stringify(response));
  } catch (error) {
    logAxiosError('Send Reward by ExperimentId', error);
  }
}

async function doSendRewardByDecisionPoint(client: UpgradeClient) {
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
      request: parsedError.config.data,
      message: parsedError.message,
      stack: parsedError.stack,
    });
  } catch {
    console.error(`\n[${functionContext} error]:`, error);
  }
}
