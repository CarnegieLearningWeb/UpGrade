/**
 * Shared Test Functions for UpGrade Client QuickTest
 *
 * This file contains all test logic that is shared across Node.js,
 * Browser JavaScript, and Browser TypeScript test environments.
 */

// Type definitions
export type Logger = (message: string, data?: any, type?: string) => void;

export interface TestConfig {
  userId: string;
  hostUrl: string;
  context: string;
  site: string;
  target: string;
  status: string;
  group: any;
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

// HTML Reporter reference (for Node environment)
let htmlReporter: any = null;

// Set reporter for Node environment
export function setHTMLReporter(reporter: any): void {
  htmlReporter = reporter;
}

// DOM Helper Functions (work in both browser and Node)
export function logToPage(message: string, type = 'log'): void {
  // If in Node environment with HTML reporter
  if (typeof document === 'undefined') {
    if (htmlReporter) {
      htmlReporter.log(message, type);
    }
    return;
  }

  const outputDiv = document.getElementById('output');
  if (!outputDiv) return;

  const entry = document.createElement('div');
  entry.className = 'log-entry';

  if (type === 'header') {
    entry.className += ' log-header';
  } else if (type === 'error') {
    entry.className += ' log-error';
  } else if (type === 'success') {
    entry.className += ' log-success';
  }

  entry.textContent = message;
  outputDiv.appendChild(entry);
}

export function updateStatus(message: string, type = 'running'): void {
  // If in Node environment with HTML reporter
  if (typeof document === 'undefined') {
    if (htmlReporter) {
      htmlReporter.updateStatus(message, type);
    }
    return;
  }

  const statusDiv = document.getElementById('status');
  if (!statusDiv) return;

  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
}

export function dualLog(message: string, data: any = null, type = 'log'): void {
  const fullMessage = data ? `${message} ${JSON.stringify(data, null, 2)}` : message;
  console.log(fullMessage);
  logToPage(fullMessage, type);
}

// Test Functions
export async function doInit(client: any, config: TestConfig): Promise<void> {
  try {
    console.log('[doInit] About to call client.init()');
    console.log('[doInit] client.init is:', typeof client.init);

    if (typeof client.init !== 'function') {
      throw new Error('client.init is not a function. Available methods: ' + Object.keys(client));
    }

    dualLog('[Init request] Calling client.init()');
    const response = await client.init();
    dualLog('[Init response]:', response);
  } catch (error) {
    console.error('[doInit] Caught error:', error);
    logAxiosError('Init', error);
  }
}

export async function doGroupMembership(client: any, config: TestConfig): Promise<void> {
  const groupRequest = config.group;
  try {
    dualLog('[Group request] Calling client.setGroupMembership():', groupRequest);
    const response = await client.setGroupMembership(groupRequest);
    dualLog('[Group response]:', response);
  } catch (error) {
    logAxiosError('Group', error);
  }
}

export async function doWorkingGroupMembership(client: any, config: TestConfig): Promise<void> {
  const workingGroupRequest = { workingGroup: config.workingGroup };
  try {
    dualLog('[Working Group request] Calling client.setWorkingGroup():', workingGroupRequest);
    const response = await client.setWorkingGroup(workingGroupRequest);
    dualLog('[Working Group response]:', response);
  } catch (error) {
    logAxiosError('Working Group', error);
  }
}

export async function doAliases(client: any, config: TestConfig): Promise<void> {
  const aliasRequest = [config.alias];
  try {
    dualLog('[Aliases request] Calling client.setAltUserIds():', aliasRequest);
    const response = await client.setAltUserIds(aliasRequest);
    dualLog('[Aliases response]:', response);
  } catch (error) {
    logAxiosError('Aliases', error);
  }
}

export async function doAssign(client: any): Promise<void> {
  try {
    dualLog('[Assign request] Calling client.getAllExperimentConditions()');
    const response = await client.getAllExperimentConditions();
    dualLog('[Assign response]:', response);
  } catch (error) {
    logAxiosError('Assign', error);
  }
}

export async function doAssignIgnoreCache(client: any): Promise<void> {
  try {
    dualLog('[Assign request] Calling client.getAllExperimentConditions() with ignoreCache: true');
    const response = await client.getAllExperimentConditions({ ignoreCache: true });
    dualLog('[Assign response]:', response);
  } catch (error) {
    logAxiosError('Assign', error);
  }
}

export async function doGetDecisionPointAssignment(client: any, config: TestConfig): Promise<string | null> {
  try {
    dualLog('[Decision Point Assignment request] Calling client.getDecisionPointAssignment():', {
      site: config.site,
      target: config.target,
    });
    const response = await client.getDecisionPointAssignment(config.site, config.target);
    dualLog('[Decision Point Assignment response]:', response);

    const condition = response.getCondition();
    dualLog('[Condition]:', condition);

    const expType = response.getExperimentType();
    dualLog('[Experiment Type]:', expType);

    const payload = response.getPayload();
    dualLog('[Payload]:', payload);

    const payloadValue = payload?.value;
    dualLog('[Payload Value]:', payloadValue);

    return condition;
  } catch (error) {
    logAxiosError('Decision Point Assignment', error);
    return null;
  }
}

export function doSetFeatureFlagUserGroupsForSession(client: any, options: any): void {
  dualLog(
    '[Feature Flag User Groups for Session request] Calling client.setFeatureFlagUserGroupsForSession():',
    options?.featureFlagUserGroupsForSession
  );
  client.setFeatureFlagUserGroupsForSession(options?.featureFlagUserGroupsForSession);
}

export async function doFeatureFlags(client: any): Promise<void> {
  try {
    dualLog('[Feature Flag request] Calling client.getAllFeatureFlags()');
    const response = await client.getAllFeatureFlags();
    dualLog('[Feature Flag response]:', response);
  } catch (error) {
    logAxiosError('Feature Flag', error);
  }
}

export async function doFeatureFlagsIgnoreCache(client: any): Promise<void> {
  try {
    dualLog('[Feature Flag request] Calling client.getAllFeatureFlags() with ignoreCache: true');
    const response = await client.getAllFeatureFlags({ ignoreCache: true });
    dualLog('[Feature Flag response]:', response);
  } catch (error) {
    logAxiosError('Feature Flag', error);
  }
}

export async function doHasFeatureFlag(client: any, config: TestConfig): Promise<void> {
  try {
    dualLog('[Has Feature Flag request] Calling client.hasFeatureFlag():', { key: config.featureFlagKey });
    const response = await client.hasFeatureFlag(config.featureFlagKey);
    dualLog('[Has Feature Flag response]:', response);
  } catch (error) {
    logAxiosError('Has Feature Flag', error);
  }
}

export async function doMark(client: any, config: TestConfig, condition: string | null): Promise<void> {
  try {
    dualLog('[Mark request] Calling client.markDecisionPoint():', {
      site: config.site,
      target: config.target,
      condition,
      status: config.status,
    });
    const response = await client.markDecisionPoint(config.site, config.target, condition, config.status);
    dualLog('[Mark response]:', response);
  } catch (error) {
    logAxiosError('Mark', error);
  }
}

export async function doLog(client: any, config: TestConfig): Promise<void> {
  if (!config.logRequest) return;
  try {
    dualLog('[Log request] Calling client.log():', config.logRequest);
    const response = await client.log(config.logRequest);
    dualLog('[Log response]:', response);
  } catch (error) {
    logAxiosError('Log', error);
  }
}

export async function doSendRewardByExperimentId(client: any, config: TestConfig): Promise<void> {
  try {
    const rewardRequest = {
      rewardValue: config.rewardValue,
      experimentId: config.experimentId,
    };
    dualLog('[Send Reward by ExperimentId request] Calling client.sendReward():', rewardRequest);
    const response = await client.sendReward(rewardRequest);
    dualLog('[Send Reward by ExperimentId response]:', response);
  } catch (error) {
    logAxiosError('Send Reward by ExperimentId', error);
  }
}

export async function doSendRewardByDecisionPoint(client: any, config: TestConfig): Promise<void> {
  try {
    const rewardRequest = {
      rewardValue: config.rewardValue,
      context: config.context,
      decisionPoint: {
        site: config.rewardSite,
        target: config.rewardTarget,
      },
    };
    dualLog('[Send Reward by Decision Point request] Calling client.sendReward():', rewardRequest);
    const response = await client.sendReward(rewardRequest);
    dualLog('[Send Reward by Decision Point response]:', response);
  } catch (error) {
    logAxiosError('Send Reward by Decision Point', error);
  }
}

// Utility Functions
export function logAxiosError(functionContext: string, error: unknown): void {
  try {
    const err = error as any;

    // Log the raw error for debugging
    console.error(`[${functionContext}] Raw error:`, error);
    console.error(`[${functionContext}] Error type:`, typeof error);
    console.error(`[${functionContext}] Error keys:`, error ? Object.keys(error) : 'null/undefined');

    if (err.message) {
      try {
        const parsedError = JSON.parse(err.message);
        const errorInfo = {
          status: parsedError.status,
          request: parsedError.config?.data,
          message: parsedError.message,
          stack: parsedError.stack,
        };
        dualLog(`[${functionContext} error]:`, errorInfo, 'error');
      } catch {
        dualLog(`[${functionContext} error]:`, err.message, 'error');
      }
    } else if (err.toString && err.toString() !== '[object Object]') {
      dualLog(`[${functionContext} error]:`, err.toString(), 'error');
    } else {
      // If it's just an empty object, try to stringify it
      try {
        const stringified = JSON.stringify(err, null, 2);
        dualLog(
          `[${functionContext} error]:`,
          stringified !== '{}' ? stringified : 'Unknown error (empty object)',
          'error'
        );
      } catch {
        dualLog(`[${functionContext} error]:`, 'Unknown error (could not stringify)', 'error');
      }
    }
  } catch (parseError) {
    console.error('Error in logAxiosError:', parseError);
    dualLog(`[${functionContext} error]:`, String(error), 'error');
  }
}

// Main Test Orchestrator
export async function runTests(client: any, config: TestConfig): Promise<void> {
  try {
    dualLog('Initializing UpGrade Client...', null, 'header');
    dualLog(`User ID: ${config.userId}`);
    dualLog(`Host URL: ${config.hostUrl}`);
    dualLog(`Context: ${config.context}`);

    dualLog('\n=== Running Init ===', null, 'header');
    await doInit(client, config);

    dualLog('\n=== Setting Group Membership ===', null, 'header');
    await doGroupMembership(client, config);

    dualLog('\n=== Setting Working Group ===', null, 'header');
    await doWorkingGroupMembership(client, config);

    dualLog('\n=== Setting Aliases ===', null, 'header');
    await doAliases(client, config);

    // Uncomment to test getAllExperimentConditions
    // dualLog('\n=== Getting All Experiment Conditions ===', null, 'header');
    // await doAssign(client);

    dualLog('\n=== Getting Decision Point Assignment ===', null, 'header');
    const condition = await doGetDecisionPointAssignment(client, config);

    // Uncomment to test feature flags
    // dualLog('\n=== Getting Feature Flags ===', null, 'header');
    // await doFeatureFlags(client);

    dualLog('\n=== Marking Decision Point ===', null, 'header');
    await doMark(client, config, condition);

    // Uncomment to send reward by experiment ID
    // dualLog('\n=== Sending Reward by ExperimentId ===', null, 'header');
    // await doSendRewardByExperimentId(client, config);

    dualLog('\n=== Sending Reward by Decision Point ===', null, 'header');
    await doSendRewardByDecisionPoint(client, config);

    // Uncomment to test logging
    // dualLog('\n=== Sending Log ===', null, 'header');
    // await doLog(client, config);

    dualLog('\n=== All Tests Completed Successfully ===', null, 'success');
    updateStatus('✓ All tests completed successfully', 'success');
  } catch (error) {
    dualLog(`\n=== Test Failed ===`, null, 'error');
    dualLog(`Error: ${(error as Error).message}`, null, 'error');
    console.error('Full error:', error);
    updateStatus('✗ Tests failed - check console for details', 'error');
  }
}

// Expose functions globally for browser script tag usage
// This allows the functions to work when loaded via <script> tags in browser-js tests
if (typeof window !== 'undefined') {
  (window as any).setHTMLReporter = setHTMLReporter;
  (window as any).logToPage = logToPage;
  (window as any).updateStatus = updateStatus;
  (window as any).dualLog = dualLog;
  (window as any).doInit = doInit;
  (window as any).doGroupMembership = doGroupMembership;
  (window as any).doWorkingGroupMembership = doWorkingGroupMembership;
  (window as any).doAliases = doAliases;
  (window as any).doAssign = doAssign;
  (window as any).doAssignIgnoreCache = doAssignIgnoreCache;
  (window as any).doGetDecisionPointAssignment = doGetDecisionPointAssignment;
  (window as any).doSetFeatureFlagUserGroupsForSession = doSetFeatureFlagUserGroupsForSession;
  (window as any).doFeatureFlags = doFeatureFlags;
  (window as any).doFeatureFlagsIgnoreCache = doFeatureFlagsIgnoreCache;
  (window as any).doHasFeatureFlag = doHasFeatureFlag;
  (window as any).doMark = doMark;
  (window as any).doLog = doLog;
  (window as any).doSendRewardByExperimentId = doSendRewardByExperimentId;
  (window as any).doSendRewardByDecisionPoint = doSendRewardByDecisionPoint;
  (window as any).logAxiosError = logAxiosError;
  (window as any).runTests = runTests;
}
