// Node.js Test Configuration
import { MARKED_DECISION_POINT_STATUS } from '../../dist/node';
import { TestConfig } from '../shared/test-functions';

const URL = {
  LOCAL: 'http://localhost:3030',
  ECS_QA: 'https://apps.qa-cli.net/upgrade-service',
  ECS_STAGING: 'https://apps.qa-cli.com/upgrade-service',
};

const userId = 'quicktest_node_user_' + new Date().getTime();
const useEphemeralGroups = false;
const group = { classId: ['STORED_USER_GROUP'] };
const workingGroup = 'STORED_USER_GROUP';
const groupsForSession = { classId: ['EPHEMERAL_USER_GROUP'] };
const includeStoredUserGroups = true;
const alias = 'alias' + userId;
const hostUrl = URL.LOCAL;
const context = 'upgrade-internal';
const site = 'asdf';
const target = 'fssfs';
const status = MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED;
const featureFlagKey = 'TEST_FEATURE_FLAG';

// Reward testing variables
const experimentId = 'f9c3927c-b786-45f5-a96c-dd9262e3b4b6';
const rewardSite = site;
const rewardTarget = target;
const rewardValue = 'SUCCESS';

const options = {
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

export const config: TestConfig = {
  userId,
  hostUrl,
  context,
  site,
  target,
  status,
  group,
  workingGroup,
  alias,
  rewardValue,
  rewardSite,
  rewardTarget,
  experimentId,
  featureFlagKey,
  options,
  logRequest,
};
