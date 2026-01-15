// Browser JavaScript Test Configuration
// This file is loaded via script tag

const URL = {
  LOCAL: 'http://localhost:3030',
  ECS_QA: 'https://apps.qa-cli.net/upgrade-service',
  ECS_STAGING: 'https://apps.qa-cli.com/upgrade-service',
};

const config = {
  userId: 'quicktest_browser_js_user_' + new Date().getTime(),
  hostUrl: URL.LOCAL,
  context: 'upgrade-internal',
  site: 'asdf',
  target: 'fssfs',
  status: 'condition applied', // MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
  group: { classId: ['STORED_USER_GROUP'] },
  workingGroup: 'STORED_USER_GROUP',
  alias: 'alias_browser_js_' + new Date().getTime(),
  rewardValue: 'SUCCESS',
  rewardSite: 'asdf',
  rewardTarget: 'fssfs',
  experimentId: 'f9c3927c-b786-45f5-a96c-dd9262e3b4b6',
  featureFlagKey: 'TEST_FEATURE_FLAG',
  options: {
    featureFlagUserGroupsForSession: null,
  },
};
