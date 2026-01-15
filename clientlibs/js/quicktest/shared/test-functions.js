"use strict";
/**
 * Shared Test Functions for UpGrade Client QuickTest
 *
 * This file contains all test logic that is shared across Node.js,
 * Browser JavaScript, and Browser TypeScript test environments.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTests = exports.logAxiosError = exports.doSendRewardByDecisionPoint = exports.doSendRewardByExperimentId = exports.doLog = exports.doMark = exports.doHasFeatureFlag = exports.doFeatureFlagsIgnoreCache = exports.doFeatureFlags = exports.doSetFeatureFlagUserGroupsForSession = exports.doGetDecisionPointAssignment = exports.doAssignIgnoreCache = exports.doAssign = exports.doAliases = exports.doWorkingGroupMembership = exports.doGroupMembership = exports.doInit = exports.dualLog = exports.updateStatus = exports.logToPage = exports.setHTMLReporter = void 0;
// HTML Reporter reference (for Node environment)
let htmlReporter = null;
// Set reporter for Node environment
function setHTMLReporter(reporter) {
    htmlReporter = reporter;
}
exports.setHTMLReporter = setHTMLReporter;
// DOM Helper Functions (work in both browser and Node)
function logToPage(message, type = 'log') {
    // If in Node environment with HTML reporter
    if (typeof document === 'undefined') {
        if (htmlReporter) {
            htmlReporter.log(message, type);
        }
        return;
    }
    const outputDiv = document.getElementById('output');
    if (!outputDiv)
        return;
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    if (type === 'header') {
        entry.className += ' log-header';
    }
    else if (type === 'error') {
        entry.className += ' log-error';
    }
    else if (type === 'success') {
        entry.className += ' log-success';
    }
    entry.textContent = message;
    outputDiv.appendChild(entry);
}
exports.logToPage = logToPage;
function updateStatus(message, type = 'running') {
    // If in Node environment with HTML reporter
    if (typeof document === 'undefined') {
        if (htmlReporter) {
            htmlReporter.updateStatus(message, type);
        }
        return;
    }
    const statusDiv = document.getElementById('status');
    if (!statusDiv)
        return;
    statusDiv.textContent = message;
    statusDiv.className = 'status ' + type;
}
exports.updateStatus = updateStatus;
function dualLog(message, data = null, type = 'log') {
    const fullMessage = data ? `${message} ${JSON.stringify(data, null, 2)}` : message;
    console.log(fullMessage);
    logToPage(fullMessage, type);
}
exports.dualLog = dualLog;
// Test Functions
function doInit(client, config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('[doInit] About to call client.init()');
            console.log('[doInit] client.init is:', typeof client.init);
            if (typeof client.init !== 'function') {
                throw new Error('client.init is not a function. Available methods: ' + Object.keys(client));
            }
            dualLog('[Init request] Calling client.init()');
            const response = yield client.init();
            dualLog('[Init response]:', response);
        }
        catch (error) {
            console.error('[doInit] Caught error:', error);
            logAxiosError('Init', error);
        }
    });
}
exports.doInit = doInit;
function doGroupMembership(client, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const groupRequest = config.group;
        try {
            dualLog('[Group request] Calling client.setGroupMembership():', groupRequest);
            const response = yield client.setGroupMembership(groupRequest);
            dualLog('[Group response]:', response);
        }
        catch (error) {
            logAxiosError('Group', error);
        }
    });
}
exports.doGroupMembership = doGroupMembership;
function doWorkingGroupMembership(client, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const workingGroupRequest = { workingGroup: config.workingGroup };
        try {
            dualLog('[Working Group request] Calling client.setWorkingGroup():', workingGroupRequest);
            const response = yield client.setWorkingGroup(workingGroupRequest);
            dualLog('[Working Group response]:', response);
        }
        catch (error) {
            logAxiosError('Working Group', error);
        }
    });
}
exports.doWorkingGroupMembership = doWorkingGroupMembership;
function doAliases(client, config) {
    return __awaiter(this, void 0, void 0, function* () {
        const aliasRequest = [config.alias];
        try {
            dualLog('[Aliases request] Calling client.setAltUserIds():', aliasRequest);
            const response = yield client.setAltUserIds(aliasRequest);
            dualLog('[Aliases response]:', response);
        }
        catch (error) {
            logAxiosError('Aliases', error);
        }
    });
}
exports.doAliases = doAliases;
function doAssign(client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            dualLog('[Assign request] Calling client.getAllExperimentConditions()');
            const response = yield client.getAllExperimentConditions();
            dualLog('[Assign response]:', response);
        }
        catch (error) {
            logAxiosError('Assign', error);
        }
    });
}
exports.doAssign = doAssign;
function doAssignIgnoreCache(client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            dualLog('[Assign request] Calling client.getAllExperimentConditions() with ignoreCache: true');
            const response = yield client.getAllExperimentConditions({ ignoreCache: true });
            dualLog('[Assign response]:', response);
        }
        catch (error) {
            logAxiosError('Assign', error);
        }
    });
}
exports.doAssignIgnoreCache = doAssignIgnoreCache;
function doGetDecisionPointAssignment(client, config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            dualLog('[Decision Point Assignment request] Calling client.getDecisionPointAssignment():', {
                site: config.site,
                target: config.target,
            });
            const response = yield client.getDecisionPointAssignment(config.site, config.target);
            dualLog('[Decision Point Assignment response]:', response);
            const condition = response.getCondition();
            dualLog('[Condition]:', condition);
            const expType = response.getExperimentType();
            dualLog('[Experiment Type]:', expType);
            const payload = response.getPayload();
            dualLog('[Payload]:', payload);
            const payloadValue = payload === null || payload === void 0 ? void 0 : payload.value;
            dualLog('[Payload Value]:', payloadValue);
            return condition;
        }
        catch (error) {
            logAxiosError('Decision Point Assignment', error);
            return null;
        }
    });
}
exports.doGetDecisionPointAssignment = doGetDecisionPointAssignment;
function doSetFeatureFlagUserGroupsForSession(client, options) {
    dualLog('[Feature Flag User Groups for Session request] Calling client.setFeatureFlagUserGroupsForSession():', options === null || options === void 0 ? void 0 : options.featureFlagUserGroupsForSession);
    client.setFeatureFlagUserGroupsForSession(options === null || options === void 0 ? void 0 : options.featureFlagUserGroupsForSession);
}
exports.doSetFeatureFlagUserGroupsForSession = doSetFeatureFlagUserGroupsForSession;
function doFeatureFlags(client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            dualLog('[Feature Flag request] Calling client.getAllFeatureFlags()');
            const response = yield client.getAllFeatureFlags();
            dualLog('[Feature Flag response]:', response);
        }
        catch (error) {
            logAxiosError('Feature Flag', error);
        }
    });
}
exports.doFeatureFlags = doFeatureFlags;
function doFeatureFlagsIgnoreCache(client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            dualLog('[Feature Flag request] Calling client.getAllFeatureFlags() with ignoreCache: true');
            const response = yield client.getAllFeatureFlags({ ignoreCache: true });
            dualLog('[Feature Flag response]:', response);
        }
        catch (error) {
            logAxiosError('Feature Flag', error);
        }
    });
}
exports.doFeatureFlagsIgnoreCache = doFeatureFlagsIgnoreCache;
function doHasFeatureFlag(client, config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            dualLog('[Has Feature Flag request] Calling client.hasFeatureFlag():', { key: config.featureFlagKey });
            const response = yield client.hasFeatureFlag(config.featureFlagKey);
            dualLog('[Has Feature Flag response]:', response);
        }
        catch (error) {
            logAxiosError('Has Feature Flag', error);
        }
    });
}
exports.doHasFeatureFlag = doHasFeatureFlag;
function doMark(client, config, condition) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield client.markDecisionPoint(config.site, config.target, condition, config.status);
            dualLog('[Mark response]:', response);
        }
        catch (error) {
            logAxiosError('Mark', error);
        }
    });
}
exports.doMark = doMark;
function doLog(client, config) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!config.logRequest)
            return;
        try {
            const response = yield client.log(config.logRequest);
            dualLog('[Log response]:', response);
        }
        catch (error) {
            logAxiosError('Log', error);
        }
    });
}
exports.doLog = doLog;
function doSendRewardByExperimentId(client, config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield client.sendReward({
                rewardValue: config.rewardValue,
                experimentId: config.experimentId,
            });
            dualLog('[Send Reward by ExperimentId response]:', response);
        }
        catch (error) {
            logAxiosError('Send Reward by ExperimentId', error);
        }
    });
}
exports.doSendRewardByExperimentId = doSendRewardByExperimentId;
function doSendRewardByDecisionPoint(client, config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield client.sendReward({
                rewardValue: config.rewardValue,
                context: config.context,
                decisionPoint: {
                    site: config.rewardSite,
                    target: config.rewardTarget,
                },
            });
            dualLog('[Send Reward by Decision Point response]:', response);
        }
        catch (error) {
            logAxiosError('Send Reward by Decision Point', error);
        }
    });
}
exports.doSendRewardByDecisionPoint = doSendRewardByDecisionPoint;
// Utility Functions
function logAxiosError(functionContext, error) {
    var _a;
    try {
        const err = error;
        // Log the raw error for debugging
        console.error(`[${functionContext}] Raw error:`, error);
        console.error(`[${functionContext}] Error type:`, typeof error);
        console.error(`[${functionContext}] Error keys:`, error ? Object.keys(error) : 'null/undefined');
        if (err.message) {
            try {
                const parsedError = JSON.parse(err.message);
                const errorInfo = {
                    status: parsedError.status,
                    request: (_a = parsedError.config) === null || _a === void 0 ? void 0 : _a.data,
                    message: parsedError.message,
                    stack: parsedError.stack,
                };
                dualLog(`[${functionContext} error]:`, errorInfo, 'error');
            }
            catch (_b) {
                dualLog(`[${functionContext} error]:`, err.message, 'error');
            }
        }
        else if (err.toString && err.toString() !== '[object Object]') {
            dualLog(`[${functionContext} error]:`, err.toString(), 'error');
        }
        else {
            // If it's just an empty object, try to stringify it
            try {
                const stringified = JSON.stringify(err, null, 2);
                dualLog(`[${functionContext} error]:`, stringified !== '{}' ? stringified : 'Unknown error (empty object)', 'error');
            }
            catch (_c) {
                dualLog(`[${functionContext} error]:`, 'Unknown error (could not stringify)', 'error');
            }
        }
    }
    catch (parseError) {
        console.error('Error in logAxiosError:', parseError);
        dualLog(`[${functionContext} error]:`, String(error), 'error');
    }
}
exports.logAxiosError = logAxiosError;
// Main Test Orchestrator
function runTests(client, config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            dualLog('Initializing UpGrade Client...', null, 'header');
            dualLog(`User ID: ${config.userId}`);
            dualLog(`Host URL: ${config.hostUrl}`);
            dualLog(`Context: ${config.context}`);
            dualLog('\n=== Running Init ===', null, 'header');
            yield doInit(client, config);
            dualLog('\n=== Setting Group Membership ===', null, 'header');
            yield doGroupMembership(client, config);
            dualLog('\n=== Setting Working Group ===', null, 'header');
            yield doWorkingGroupMembership(client, config);
            dualLog('\n=== Setting Aliases ===', null, 'header');
            yield doAliases(client, config);
            // Uncomment to test getAllExperimentConditions
            // dualLog('\n=== Getting All Experiment Conditions ===', null, 'header');
            // await doAssign(client);
            dualLog('\n=== Getting Decision Point Assignment ===', null, 'header');
            const condition = yield doGetDecisionPointAssignment(client, config);
            // Uncomment to test feature flags
            // dualLog('\n=== Getting Feature Flags ===', null, 'header');
            // await doFeatureFlags(client);
            dualLog('\n=== Marking Decision Point ===', null, 'header');
            yield doMark(client, config, condition);
            // Uncomment to send reward by experiment ID
            // dualLog('\n=== Sending Reward by ExperimentId ===', null, 'header');
            // await doSendRewardByExperimentId(client, config);
            dualLog('\n=== Sending Reward by Decision Point ===', null, 'header');
            yield doSendRewardByDecisionPoint(client, config);
            // Uncomment to test logging
            // dualLog('\n=== Sending Log ===', null, 'header');
            // await doLog(client, config);
            dualLog('\n=== All Tests Completed Successfully ===', null, 'success');
            updateStatus('✓ All tests completed successfully', 'success');
        }
        catch (error) {
            dualLog(`\n=== Test Failed ===`, null, 'error');
            dualLog(`Error: ${error.message}`, null, 'error');
            console.error('Full error:', error);
            updateStatus('✗ Tests failed - check console for details', 'error');
        }
    });
}
exports.runTests = runTests;
// Expose functions globally for browser script tag usage
// This allows the functions to work when loaded via <script> tags in browser-js tests
if (typeof window !== 'undefined') {
    window.setHTMLReporter = setHTMLReporter;
    window.logToPage = logToPage;
    window.updateStatus = updateStatus;
    window.dualLog = dualLog;
    window.doInit = doInit;
    window.doGroupMembership = doGroupMembership;
    window.doWorkingGroupMembership = doWorkingGroupMembership;
    window.doAliases = doAliases;
    window.doAssign = doAssign;
    window.doAssignIgnoreCache = doAssignIgnoreCache;
    window.doGetDecisionPointAssignment = doGetDecisionPointAssignment;
    window.doSetFeatureFlagUserGroupsForSession = doSetFeatureFlagUserGroupsForSession;
    window.doFeatureFlags = doFeatureFlags;
    window.doFeatureFlagsIgnoreCache = doFeatureFlagsIgnoreCache;
    window.doHasFeatureFlag = doHasFeatureFlag;
    window.doMark = doMark;
    window.doLog = doLog;
    window.doSendRewardByExperimentId = doSendRewardByExperimentId;
    window.doSendRewardByDecisionPoint = doSendRewardByDecisionPoint;
    window.logAxiosError = logAxiosError;
    window.runTests = runTests;
}
//# sourceMappingURL=test-functions.js.map