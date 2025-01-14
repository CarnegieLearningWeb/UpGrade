// to run: npx ts-node clientlibs/js/quickTest.ts

import UpgradeClient, { MARKED_DECISION_POINT_STATUS, UpGradeClientInterfaces } from './dist/node';

const URL = {
  LOCAL: 'http://localhost:3030',
  BEANSTALK_QA: 'https://upgradeapi.qa-cli.net',
  BEANSTALK_STAGING: 'https://upgradeapi.qa-cli.com',
  ECS_QA: 'https://apps.qa-cli.net/upgrade-service',
  ECS_STAGING: 'https://apps.qa-cli.com/upgrade-service',
};

const userId = 'quicktest_user_' + Date.now().toString();
const group = 'test_class_group';
const alias = 'alias' + userId;
const hostUrl = URL.LOCAL;
const context = 'assign-prog';
const site = 'SelectSection';
const target = 'absolute_value_plot_equality';
const condition: string | null = null;
const status = MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED;
const featureFlagKey = 'TEST_FEATURE_FLAG';
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
  const client = new UpgradeClient(userId, hostUrl, context);
  await doInit(client);
  await doGroupMembership(client);
  await doWorkingGroupMembership(client);
  await doAliases(client);
  await doAssign(client);
  await doGetDecisionPointAssignment(client);
  await doFeatureFlags(client);
  await doHasFeatureFlag(client);
  await doMark(client);
  await doLog(client);
}

/** test functions *******************************************************************************/

async function doInit(client: UpgradeClient) {
  try {
    const response = await client.init();
    console.log('[Init response]:', JSON.stringify(response));
  } catch (error) {
    console.error('[Init error]:', error);
  }
}

async function doGroupMembership(client: UpgradeClient) {
  const groupRequest: UpGradeClientInterfaces.IExperimentUserGroup = {
    schoolId: [group],
  };

  try {
    const response = await client.setGroupMembership(groupRequest);
    console.log('[Group response]:', JSON.stringify(response));
  } catch (error) {
    console.error('[Group error]:', error);
  }
}

async function doWorkingGroupMembership(client: UpgradeClient) {
  const workingGroupRequest: UpGradeClientInterfaces.IExperimentUserWorkingGroup = {
    workingGroup: group,
  };
  try {
    const response = await client.setWorkingGroup(workingGroupRequest);
    console.log('[Working Group response]:', JSON.stringify(response));
  } catch (error) {
    console.error('[Working Group error]:', error);
  }
}

async function doAliases(client: UpgradeClient) {
  const aliasRequest = [alias];
  try {
    const response = await client.setAltUserIds(aliasRequest);
    console.log('[Aliases response]:', JSON.stringify(response));
  } catch (error) {
    console.error('[Aliases error]:', error);
  }
}

async function doAssign(client: UpgradeClient) {
  try {
    const response = await client.getAllExperimentConditions();
    console.log('[Assign response]:', JSON.stringify(response));
  } catch (error) {
    console.error('[Assign error]:', error);
  }
}

async function doGetDecisionPointAssignment(client: UpgradeClient) {
  try {
    const response = await client.getDecisionPointAssignment(site, target);
    console.log('[Decision Point Assignment response]:', JSON.stringify(response));

    const condition = response.getCondition();
    console.log('[Condition]:', JSON.stringify(condition));
    
    const expType = response.getExperimentType();
    console.log('[Experiment Type]:', JSON.stringify(expType));

    const payload = response.getPayload();
    console.log('[Payload]:', JSON.stringify(payload));

    const payloadValue = payload?.value;
    console.log('[payloadValue]:', JSON.stringify(payloadValue));

  } catch (error) {
    console.error('[Decision Point Assignment error]:', error);
  }
}

async function doFeatureFlags(client: UpgradeClient) {
  try {
    const response = await client.getAllFeatureFlags();
    console.log('[Feature Flag response]:', JSON.stringify(response));
  } catch (error) {
    console.error('[Feature Flag error]:', error);
  }
}

async function doHasFeatureFlag(client: UpgradeClient) {
  try {
    const response = client.hasFeatureFlag(featureFlagKey);
    console.log('[Has Feature Flag response]:', JSON.stringify(response));
  } catch (error) {
    console.error('[Has Feature Flag error]:', error);
  }
}

async function doMark(client: UpgradeClient) {
  try {
    const response = await client.markDecisionPoint(site, target, condition, status);
    console.log('[Mark response]:', JSON.stringify(response));
  } catch (error) {
    console.error('[Mark error]:', error);
  }
}

async function doLog(client: UpgradeClient) {
  try {
    const response = await client.log(logRequest);
    console.log('[Log response]:', JSON.stringify(response));
  } catch (error) {
    console.error('[Log error]:', error);
  }
}
