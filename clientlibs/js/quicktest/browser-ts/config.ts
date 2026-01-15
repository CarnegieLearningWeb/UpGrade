// Browser TypeScript Test Configuration
// This file compiles to plain JavaScript and is loaded via script tag
// No imports/exports - uses window object for global access

// Type definition for config (inline since we can't import)
interface TestConfigType {
  userId: string;
  hostUrl: string;
  context: string;
  site: string;
  target: string;
  status: string;
  group: { classId: string[] };
  workingGroup: string;
  alias: string;
  rewardValue: string;
  rewardSite: string;
  rewardTarget: string;
  experimentId: string;
  featureFlagKey: string;
  options: any;
  logRequest?: any;
}

interface URLSType {
  LOCAL: string;
  ECS_QA: string;
  ECS_STAGING: string;
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    URLS: URLSType;
    config: TestConfigType;
  }
}

// Attach to window object for global access across script files
window.URLS = {
  LOCAL: 'http://localhost:3030',
  ECS_QA: 'https://apps.qa-cli.net/upgrade-service',
  ECS_STAGING: 'https://apps.qa-cli.com/upgrade-service',
};

// Config object made available globally via window
window.config = {
  userId: 'quicktest_browser_ts_user_' + new Date().getTime(),
  hostUrl: window.URLS.LOCAL,
  context: 'upgrade-internal',
  site: 'asdf',
  target: 'fssfs',
  status: 'CONDITION_APPLIED', // MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED
  group: { classId: ['STORED_USER_GROUP'] },
  workingGroup: 'STORED_USER_GROUP',
  alias: 'alias_browser_ts_' + new Date().getTime(),
  rewardValue: 'SUCCESS',
  rewardSite: 'asdf',
  rewardTarget: 'fssfs',
  experimentId: 'f9c3927c-b786-45f5-a96c-dd9262e3b4b6',
  featureFlagKey: 'TEST_FEATURE_FLAG',
  options: {
    featureFlagUserGroupsForSession: null,
  },
};

// Make this file a module so the global declaration works
export {};
