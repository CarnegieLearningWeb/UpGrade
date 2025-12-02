// to run: npx ts-node clientlibs/js/quickTest.ts

import UpgradeClient, { MARKED_DECISION_POINT_STATUS, UpGradeClientInterfaces } from './dist/node';
import {
  ASSIGNMENT_ALGORITHM,
  ASSIGNMENT_UNIT,
  CONSISTENCY_RULE,
  EXPERIMENT_STATE,
  EXPERIMENT_TYPE,
  FILTER_MODE,
  MoocletTSConfigurablePolicyParametersDTO,
  POST_EXPERIMENT_RULE,
} from '../../types';

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
const context = 'upgrade-internal';
const site = 'asdf';
const target = 'fssfs';
const status = MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED;
const featureFlagKey = 'TEST_FEATURE_FLAG';
const experimentId = 'f9c3927c-b786-45f5-a96c-dd9262e3b4b6'; // needed for reward testing
const rewardSite = site;
const rewardTarget = target;

// Experiment creation variables - modify these to create different types of experiments
// const experimentConfig = {
//   name: 'Quick Test Experiment ' + Date.now(),
//   description: 'A test experiment created via quickTest.ts',
//   context: [context],
//   state: EXPERIMENT_STATE.ENROLLING,
//   startOn: null, // ISO date string or null
//   endOn: null, // ISO date string or null
//   consistencyRule: CONSISTENCY_RULE.INDIVIDUAL, // 'individual', 'experiment', 'group'
//   assignmentUnit: ASSIGNMENT_UNIT.INDIVIDUAL, // 'individual', 'group', 'within-subjects'
//   postExperimentRule: POST_EXPERIMENT_RULE.CONTINUE,
//   assignmentAlgorithm: ASSIGNMENT_ALGORITHM.MOOCLET_TS_CONFIGURABLE,
//   enrollmentCompleteCondition: null, // { userCount: 100, groupCount: 20 } or null
//   revertTo: null, // condition id to revert to, or null
//   tags: ['quicktest', 'automated'],
//   group: null, // group key if assignmentUnit is 'group', otherwise null
//   conditionOrder: null, // 'random', 'ordered_round_robin', 'ordered_sequential' (only for within-subjects)
//   filterMode: FILTER_MODE.INCLUDE_ALL, // 'includeAll', 'excludeAll'
//   stratificationFactor: null, // { stratificationFactorName: 'gender' } or null
//   type: EXPERIMENT_TYPE.SIMPLE, // 'Simple', 'Factorial'

//   // Conditions - at least one required
//   conditions: [
//     {
//       id: 'control' + Date.now(),
//       name: 'control',
//       description: 'Control condition',
//       conditionCode: 'control',
//       assignmentWeight: 50,
//       order: 1,
//     },
//     {
//       id: 'variant' + Date.now(),
//       name: 'variant',
//       description: 'Treatment condition',
//       conditionCode: 'variant',
//       assignmentWeight: 50,
//       order: 2,
//     },
//   ],

//   // Factors - only for factorial experiments
//   factors: [],

//   // Partitions (decision points) - at least one required
//   partitions: [
//     {
//       id: 'partition_1_' + Date.now(),
//       twoCharacterId: 'P1',
//       site: site,
//       target: target,
//       description: 'Test decision point',
//       order: 1,
//       excludeIfReached: false,
//     },
//   ],

//   // Queries - optional, for analytics
//   queries: [],

//   conditionPayloads: [],

//   // Segment inclusion - required
//   experimentSegmentInclusion: {
//     segment: {
//       type: 'public', // 'public', 'private'
//       name: null,
//       description: null,
//       context: null,
//       individualForSegment: [],
//       groupForSegment: [],
//       subSegments: [],
//     },
//   },

//   // Segment exclusion - required
//   experimentSegmentExclusion: {
//     segment: {
//       type: 'public', // 'public', 'private'
//       name: null,
//       description: null,
//       context: null,
//       individualForSegment: [],
//       groupForSegment: [],
//       subSegments: [],
//     },
//   },

//   // Mooclet policy parameters - only for adaptive experiments
//   // moocletPolicyParameters: new MoocletTSConfigurablePolicyParametersDTO(),
// };

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
  // Create experiment first (optional - uncomment to test)
  // const createdExperimentId = await doCreateExperiment();

  const client = new UpgradeClient(userId, hostUrl, context, options);
  await doInit(client);
  // await doGroupMembership(client);
  // await doWorkingGroupMembership(client);
  // await doAliases(client);
  await doAssign(client);
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
  if (experimentId) {
    // await doSendRewardByExperimentId(client);
    // await doSendRewardWithEnum(client);
  }
  await doSendRewardByDecisionPoint(client);
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

async function doAssignIgnoreCache(client: UpgradeClient) {
  try {
    const response = await client.getAllExperimentConditions({ ignoreCache: true });
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

async function doFeatureFlagsIgnoreCache(client: UpgradeClient) {
  try {
    const response = await client.getAllFeatureFlags({ ignoreCache: true });
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

async function doSendRewardByExperimentId(client: UpgradeClient) {
  try {
    const response = await client.sendReward({
      rewardValue: 'SUCCESS',
      experimentId,
    });
    console.log('\n[Send Reward by ExperimentId response]:', JSON.stringify(response));
  } catch (error) {
    console.error('\n[Send Reward by ExperimentId error]:', error);
  }
}

async function doSendRewardByDecisionPoint(client: UpgradeClient) {
  try {
    const response = await client.sendReward({
      rewardValue: 'FAILURE',
      context,
      decisionPoint: {
        site: rewardSite,
        target: rewardTarget,
      },
    });
    console.log('\n[Send Reward by Decision Point response]:', JSON.stringify(response));
  } catch (error) {
    console.error('\n[Send Reward by Decision Point error]:', error);
  }
}

async function doSendRewardWithEnum(client: UpgradeClient) {
  try {
    const response = await client.sendReward({
      rewardValue: UpgradeClient.BINARY_REWARD_VALUE.SUCCESS,
      experimentId,
    });
    console.log('\n[Send Reward with Enum response]:', JSON.stringify(response));
  } catch (error) {
    console.error('\n[Send Reward with Enum error]:', error);
  }
}

// async function doCreateExperiment(): Promise<string | null> {
//   try {
//     // Build the experiment payload from config
//     const experimentPayload = {
//       name: experimentConfig.name,
//       description: experimentConfig.description,
//       context: experimentConfig.context,
//       state: experimentConfig.state,
//       startOn: experimentConfig.startOn,
//       endOn: experimentConfig.endOn,
//       consistencyRule: experimentConfig.consistencyRule,
//       assignmentUnit: experimentConfig.assignmentUnit,
//       postExperimentRule: experimentConfig.postExperimentRule,
//       assignmentAlgorithm: experimentConfig.assignmentAlgorithm,
//       enrollmentCompleteCondition: experimentConfig.enrollmentCompleteCondition,
//       revertTo: experimentConfig.revertTo,
//       tags: experimentConfig.tags,
//       group: experimentConfig.group,
//       conditionOrder: experimentConfig.conditionOrder,
//       filterMode: experimentConfig.filterMode,
//       stratificationFactor: experimentConfig.stratificationFactor,
//       type: experimentConfig.type,
//       conditions: experimentConfig.conditions,
//       factors: experimentConfig.factors,
//       partitions: experimentConfig.partitions,
//       queries: experimentConfig.queries,
//       conditionPayloads: experimentConfig.conditionPayloads,
//       experimentSegmentInclusion: experimentConfig.experimentSegmentInclusion,
//       experimentSegmentExclusion: experimentConfig.experimentSegmentExclusion,
//       // moocletPolicyParameters: experimentConfig.moocletPolicyParameters,
//     };

//     console.log('\n[Creating experiment with payload]:', JSON.stringify(experimentPayload, null, 2));

//     const response = await fetch(`${hostUrl}/api/experiments`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(experimentPayload),
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error('\n[Create Experiment HTTP error]:', response.status, errorText);
//       return null;
//     }

//     const data = await response.json();
//     console.log('\n[Create Experiment response]:', JSON.stringify(data, null, 2));

//     const experimentId = data.id;
//     console.log('\n[✓ Created Experiment ID]:', experimentId);

//     return experimentId;
//   } catch (error) {
//     console.error('\n[Create Experiment error]:', error);
//     return null;
//   }
// }
