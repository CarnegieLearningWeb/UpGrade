// to run: npx ts-node clientlibs/js/quickTest.ts

import UpgradeClient, { Assignment, MARKED_DECISION_POINT_STATUS, UpGradeClientInterfaces } from './dist/node';

const URL = {
  LOCAL: 'http://localhost:3030',
  BEANSTALK_QA: 'https://upgradeapi.qa-cli.net',
  BEANSTALK_STAGING: 'https://upgradeapi.qa-cli.com',
  ECS_QA: 'https://apps.qa-cli.net/upgrade-service',
  ECS_STAGING: 'https://apps.qa-cli.com/upgrade-service',
};

const userId = 'qwerty7r3';
const useEphemeralGroups = false;
const group = { classId: ['STORED_USER_GROUP'] };
const workingGroup = 'STORED_USER_GROUP';
const groupsForSession = { classId: ['EPHEMERAL_USER_GROUP'] };
const includeStoredUserGroups = true; // true to merge with stored user groups, false for session-only groups
const alias = 'alias' + userId;
const hostUrl = URL.ECS_QA;
const context = 'upgrade-internal';
const site = 'fakesite';
const target = 'faketarget';
const status = MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED;
const featureFlagKey = 'TEST_FEATURE_FLAG';
const rewardMetric = 'M7_REWARD';

const options: UpGradeClientInterfaces.IConfigOptions = {
  featureFlagUserGroupsForSession: useEphemeralGroups
    ? {
        groupsForSession,
        includeStoredUserGroups,
      }
    : null,
};

/** utility functions *******************************************************************************/

function generateRandomUUID(): string {
  // Generate a random UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

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
        [rewardMetric]: 'SUCCESS',
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

// quickTest();

/** main test *******************************************************************************/
async function quickTest() {
  const client = new UpgradeClient(userId, hostUrl, context, options);
  await doInit(client);
  await doGroupMembership(client);
  await doWorkingGroupMembership(client);
  // await doAliases(client);
  // await doAssign(client);
  const condition = await doGetDecisionPointAssignment(client);
  doSetFeatureFlagUserGroupsForSession(client, options);
  // await doFeatureFlags(client);
  // await doHasFeatureFlag(client);
  // await doMark(client, condition);
  // await doLog(client);
}

/** test functions *******************************************************************************/

async function doInit(client: UpgradeClient) {
  try {
    const response = await client.init();
    console.log('\n[Init response]:', JSON.stringify(response));
  } catch (error) {
    console.error('\n[Init error]:', error);
  }
}

async function doGroupMembership(client: UpgradeClient) {
  const groupRequest: UpGradeClientInterfaces.IExperimentUserGroup = group;

  try {
    const response = await client.setGroupMembership(groupRequest);
    console.log('\n[Group response]:', JSON.stringify(response));
  } catch (error) {
    console.error('\n[Group error]:', error);
  }
}

async function doWorkingGroupMembership(client: UpgradeClient) {
  const workingGroupRequest: UpGradeClientInterfaces.IExperimentUserWorkingGroup = { workingGroup };
  try {
    const response = await client.setWorkingGroup(workingGroupRequest);
    console.log('\n[Working Group response]:', JSON.stringify(response));
  } catch (error) {
    console.error('\n[Working Group error]:', error);
  }
}

async function doAliases(client: UpgradeClient) {
  const aliasRequest = [alias];
  try {
    const response = await client.setAltUserIds(aliasRequest);
    console.log('\n[Aliases response]:', JSON.stringify(response));
  } catch (error) {
    console.error('\n[Aliases error]:', error);
  }
}

async function doAssign(client: UpgradeClient) {
  try {
    const response = await client.getAllExperimentConditions();
    console.log('\n[Assign response]:', JSON.stringify(response));
  } catch (error) {
    console.error('\n[Assign error]:', error);
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
    console.error('\n[Decision Point Assignment error]:', error);
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
    console.error('\n[Feature Flag error]:', error);
  }
}

async function doHasFeatureFlag(client: UpgradeClient) {
  try {
    const response = await client.hasFeatureFlag(featureFlagKey);
    console.log('\n[Has Feature Flag response]:', response);
  } catch (error) {
    console.error('\n[Has Feature Flag error]:', error);
  }
}

async function doMark(client: UpgradeClient, condition: string | null) {
  try {
    const response = await client.markDecisionPoint(site, target, condition, status);
    // console.log('\n[Mark response]:', JSON.stringify(response));
  } catch (error) {
    console.error('\n[Mark error]:', error);
  }
}

async function doLog(client: UpgradeClient) {
  try {
    const response = await client.log(logRequest);
    // console.log('\n[Log response]:', JSON.stringify(response));
  } catch (error) {
    console.error('\n[Log error]:', error);
  }
}

/** assign requests for different users */
async function doBulkAssignRequests(
  n: number,
  site: string,
  target: string,
  rewardRatio?: number[],
  delayMs?: number
): Promise<void> {
  const results: Array<{ assignment: any; reward: 'SUCCESS' | 'FAILURE' | null; error: any }> = [];

  // Process users sequentially instead of in parallel
  for (let i = 0; i < n; i++) {
    try {
      // Add delay between user requests if specified
      if (delayMs && i > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      const userId = `user_${new Date().getTime()}_${i}`;
      const client = new UpgradeClient(userId, hostUrl, context, options);
      await client.init(group);
      await client.setWorkingGroup({ schoolId: workingGroup });
      const assignment = await client.getDecisionPointAssignment(site, target);
      let reward: 'SUCCESS' | 'FAILURE' | null = null;

      if (rewardRatio) {
        // Simulate a reward assignment based on the provided ratio
        const randomValue = Math.random();
        reward = randomValue < rewardRatio[0] ? 'SUCCESS' : 'FAILURE';
        await doMark(client, assignment.getPayload()?.value || null);
        logRequest[0].metrics.attributes[rewardMetric] = reward;
        await doLog(client);
      }

      console.log(`\n[Bulk Assign user ${i + 1}/${n}]:`, {
        userId,
        assignment: assignment.getPayload()?.value,
        reward,
      });
      results.push({ assignment, reward, error: null });
    } catch (error) {
      const userId = `user_${new Date().getTime()}_${i}`;
      console.error(`\n[Bulk Assign user ${i + 1}/${n} error]:`, {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      results.push({ assignment: null, reward: null, error });
    }
  }

  try {
    // Separate successful and failed results
    const successfulResults = results.filter((result) => result.assignment !== null);
    const failedResults = results.filter((result) => result.error !== null);

    console.log(
      `\n[Bulk Assign Summary]: ${successfulResults.length} successful, ${failedResults.length} failed out of ${n} total`
    );

    if (successfulResults.length > 0) {
      const summary = successfulResults.map(({ assignment }) => {
        return assignment?.getPayload()?.value;
      });
      const countOfRewards = summary.reduce((acc, value) => {
        if (!value) return acc;
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const percentages = Object.entries(countOfRewards).map(([reward, count]) => {
        const percentage = ((Number(count) / successfulResults.length) * 100).toFixed(2);
        return `${reward}: ${count} (${percentage}%)`;
      });
      console.log('\n[Bulk Assign percentages]:', percentages.join(', '));
    }
  } catch (error) {
    console.error('\n[Bulk Assign error]:', error);
  }
}

doBulkAssignRequests(98, site, target, [0.25, 0.25], 0);
