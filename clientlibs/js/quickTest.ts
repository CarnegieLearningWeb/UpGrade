// to run: npx ts-node clientlibs/js/quickTest.ts

import UpgradeClient, { MARKED_DECISION_POINT_STATUS, UpGradeClientInterfaces } from './dist/node';

const URL = {
  LOCAL: 'http://localhost:3030',
  BEANSTALK_QA: 'https://upgradeapi.qa-cli.net',
  BEANSTALK_STAGING: 'https://upgradeapi.qa-cli.com',
  ECS_QA: 'https://apps.qa-cli.net/upgrade-service',
  ECS_STAGING: 'https://apps.qa-cli.com/upgrade-service',
};

const userId = 'qwerty6';
const useEphemeralGroups = false;
const group = { classId: ['STORED_USER_GROUP'] };
const workingGroup = 'STORED_USER_GROUP';
const groupsForSession = { classId: ['EPHEMERAL_USER_GROUP'] };
const includeStoredUserGroups = true; // true to merge with stored user groups, false for session-only groups
const alias = 'alias' + userId;
const hostUrl = URL.LOCAL;
const context = 'mathstream';
const site = 'SelectSection';
const target = 'absolute_value_plot_equality';
const status = MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED;
const featureFlagKey = 'TEST_FEATURE_FLAG';

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
  await doAssign(client);
  const condition = await doGetDecisionPointAssignment(client);
  doSetFeatureFlagUserGroupsForSession(client, options);
  await doFeatureFlags(client);
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
    console.log('\n[Mark response]:', JSON.stringify(response));
  } catch (error) {
    console.error('\n[Mark error]:', error);
  }
}

async function doLog(client: UpgradeClient) {
  try {
    const response = await client.log(logRequest);
    console.log('\n[Log response]:', JSON.stringify(response));
  } catch (error) {
    console.error('\n[Log error]:', error);
  }
}
