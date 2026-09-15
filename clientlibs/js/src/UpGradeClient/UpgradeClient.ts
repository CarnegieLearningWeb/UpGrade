import { UpGradeClientInterfaces } from '../types';
import {
  ILogInput,
  CaliperEnvelope,
  IExperimentAssignment,
  MARKED_DECISION_POINT_STATUS,
  IUserAliases,
  BinaryRewardAllowedValue,
} from 'upgrade_types';
import Assignment from '../Assignment/Assignment';
import ApiService from '../ApiService/ApiService';
import { DataService, DEFAULT_GROUPSET_ID, IGroupsetDefinition } from '../DataService/DataService';

/** Which groupset `hasFeatureFlag(key)` (no id) resolves to, and what else is configured alongside it. */
type ActiveGroupConfig =
  | { kind: 'single'; groupsetId: string }
  | { kind: 'multiple'; mainGroupsetId: string | null; subGroupsetIds: string[] };

declare const API_VERSION: string;

// crypto.randomUUID() is only available in secure contexts (HTTPS).
// crypto.getRandomValues() is available in both secure and insecure contexts.
// Fall back to Math.random() only as a last resort for very old environments.
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant bits
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  console.warn(
    'upgrade_client_lib: crypto.getRandomValues is unavailable; falling back to Math.random() for clientSessionId generation. This is not cryptographically secure.'
  );
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * UpGradeClient is the main class for interacting with the UpGrade API.
 *
 * @example
 * ```typescript
 * import UpgradeClient from 'upgrade_client_lib/dist/browser';
 * ```
 *
 * ```typescript
 * import UpgradeClient from 'upgrade_client_lib/dist/node';
 * ```
 *
 * General UpGrade types can also be accessed as named exports:
 * ```typescript
 * import UpgradeClient, { IExperimentAssignment } from 'upgrade_client_lib/dist/browser';
 * ```
 *
 * SDK-Specific types can be accessed also:
 * ```typescript
 * import { UpGradeClientInterfaces } from 'upgrade_client_lib/dist/clientlibs/js/src/identifiers';
 *
 * const initResponse: UpGradeClientInterfaces.IUser = await upgradeClient.init();
 * ```
 */

export default class UpgradeClient {
  private apiService: ApiService;
  private dataService: DataService;

  // allow MARKED_DECISION_POINT_STATUS to be exposed on the client a la UpgradeClient.MARKED_DECISION_POINT_STATUS
  // this will allow js users who are not using the upgrade types package to use this enum for markExperimentPoint()
  public static MARKED_DECISION_POINT_STATUS = MARKED_DECISION_POINT_STATUS;

  // allow BINARY_REWARD_VALUE to be exposed on the client a la UpgradeClient.BINARY_REWARD_VALUE
  // this will allow js users who are not using the upgrade types package to use this enum for sendReward()
  public static BINARY_REWARD_VALUE = BinaryRewardAllowedValue;

  /**
   * When constructing UpgradeClient, the user id, api host url, and "context" identifier are required.
   * These will be attached to various API calls for this instance of the client.
   *
   * @example
   *
   * ```typescript
   * // required
   * const hostUrl: "htts://my-hosted-upgrade-api.com";
   * const userId: "abc123";
   * const context: "my-app-context-name";
   *
   * // not required, each is also optional
   * const options: {
   *   token: "someToken";
   *   clientSessionId: "someSessionId";
   *   featureFlagGroupOptions: null
   * }
   *
   * const upgradeClient: UpgradeClient[] = new UpgradeClient(hostURL, userId, context);
   * const upgradeClient: UpgradeClient[] = new UpgradeClient(hostURL, userId, context, options);
   * ```
   *
   * `featureFlagGroupOptions` configures how `/v6/featureflag` requests are evaluated. Provide
   * exactly one of:
   *
   * - `useSingleGroupSet` — the classic one-groupset approach. `getAllFeatureFlags()` returns a
   *   flat `string[]`, `hasFeatureFlag(key)` needs no id.
   * - `useMultipleGroupSets` — an optional `mainGroupset` plus one or more named `subGroupsets`,
   *   all fetched together in one request. `getAllFeatureFlags()` returns
   *   `{ mainGroupset?: string[]; subGroupsets: Record<string, string[]> }`. `hasFeatureFlag(key)`
   *   (no id) resolves to `mainGroupset` if one was configured, and throws otherwise — pass a
   *   `groupsetId` to check a specific named subGroupset instead.
   *
   * Omit `featureFlagGroupOptions` entirely for the default: standard stored-user lookup, single
   * groupset.
   *
   * ```typescript
   * const options: UpGradeClientInterfaces.IConfigOptions = {
   *   featureFlagGroupOptions: {
   *     useSingleGroupSet: {
   *       groups: { classId: ['testClass'] },
   *       includeStoredUserGroups: false, // optional — omitting it is the same as false
   *     },
   *   },
   * };
   *
   * const upgradeClient = new UpgradeClient(hostURL, userId, context, options);
   * ```
   *
   * **Stored-user Mode** (Standard stored user lookup):
   * - Omit `useSingleGroupSet`/`useMultipleGroupSets` (and the deprecated `groupsForSession`)
   * - Uses only stored user groups from the database
   * - User must already have been initialized, will 404 if user does not exist
   *
   * **Ephemeral Mode** (caller-provided groups only):
   * - Provide `groups`; `includeStoredUserGroups` is optional and defaults to `false`
   * - Uses only the provided groups, ignoring any stored user groups
   * - Does not require the user to be initialized (it will bypass stored user lookup)
   *
   * **Merged Mode** (stored + caller-provided groups):
   * - Provide `groups` and `includeStoredUserGroups: true` (always explicit — never inferred)
   * - User must already have been initialized, will 404 if user does not exist
   * - Provided groups are merged with stored groups; never persisted
   *
   * Note: `featureFlagUserGroupsForSession` (with `groupsForSession`/`includeStoredUserGroups`) is
   * a deprecated, singular-only synonym for `featureFlagGroupOptions.useSingleGroupSet` — still
   * supported, but the new shape is preferred going forward.
   */

  // Which groupset(s) getAllFeatureFlags()/hasFeatureFlag() use when called with no arguments.
  // Defaults to the standard stored-user lookup, single groupset.
  private activeConfig: ActiveGroupConfig = { kind: 'single', groupsetId: DEFAULT_GROUPSET_ID };

  constructor(userId: string, hostUrl: string, context: string, options?: UpGradeClientInterfaces.IConfigOptions) {
    const config: UpGradeClientInterfaces.IConfig = {
      apiVersion: 'v' + API_VERSION,
      userId: userId,
      hostURL: hostUrl,
      context: context,
      clientSessionId: options?.clientSessionId || generateUUID(),
      token: options?.token,
      httpClient: options?.httpClient,
    };

    this.dataService = new DataService();
    this.apiService = new ApiService(config, this.dataService);

    const featureFlagGroupOptions: UpGradeClientInterfaces.IFeatureFlagGroupOptions | null =
      options?.featureFlagGroupOptions ??
      (options?.featureFlagUserGroupsForSession
        ? {
            useSingleGroupSet: {
              groups: options.featureFlagUserGroupsForSession.groupsForSession,
              includeStoredUserGroups: options.featureFlagUserGroupsForSession.includeStoredUserGroups,
            },
          }
        : null);

    this.setFeatureFlagGroupOptions(featureFlagGroupOptions);
  }

  /**
   * Registers the shared main/single groupset's definition under the fixed `DEFAULT_GROUPSET_ID`
   * slot and returns that id. There's only ever one main/single groupset active at a time, so
   * unlike subGroupsets entries it never needs (or accepts) a caller-supplied id. Since the id no
   * longer varies with content, flags already cached under this slot are cleared whenever the
   * definition actually changes, so a stale value is never served under the new definition.
   */
  private registerSingle(entry: UpGradeClientInterfaces.ISingleGroupSetOptions, label: string): string {
    if (!entry?.groups) {
      throw new Error(`${label}.groups is required.`);
    }
    const definition: IGroupsetDefinition = {
      groups: entry.groups,
      includeStoredUserGroups: entry.includeStoredUserGroups,
    };
    const previous = this.dataService.getGroupsetDefinition(DEFAULT_GROUPSET_ID);
    if (previous && JSON.stringify(previous) !== JSON.stringify(definition)) {
      this.dataService.clearFeatureFlagsForGroupset(DEFAULT_GROUPSET_ID);
    }
    this.dataService.registerGroupsetDefinition(DEFAULT_GROUPSET_ID, definition);
    return DEFAULT_GROUPSET_ID;
  }

  /**
   * Registers one subGroupsets entry (groupsetId is required — never auto-generated) and returns
   * it. The reserved main/single slot id may not be reused here, since the two would otherwise
   * collide and silently share one cached evaluation.
   */
  private registerSub(entry: UpGradeClientInterfaces.ISubGroupSetOptions): string {
    if (!entry?.groupsetId) {
      throw new Error('Each subGroupsets entry requires a groupsetId.');
    }
    if (entry.groupsetId === DEFAULT_GROUPSET_ID) {
      throw new Error(`subGroupsets entry may not use the reserved groupset id "${DEFAULT_GROUPSET_ID}".`);
    }
    if (!entry.groups) {
      throw new Error(`subGroupsets entry "${entry.groupsetId}" requires groups.`);
    }
    const definition: IGroupsetDefinition = {
      groups: entry.groups,
      includeStoredUserGroups: entry.includeStoredUserGroups,
    };
    const previous = this.dataService.getGroupsetDefinition(entry.groupsetId);
    if (previous && JSON.stringify(previous) !== JSON.stringify(definition)) {
      this.dataService.clearFeatureFlagsForGroupset(entry.groupsetId);
    }
    this.dataService.registerGroupsetDefinition(entry.groupsetId, definition);
    return entry.groupsetId;
  }

  /**
   * Sets the active feature flag groupset configuration used when `getAllFeatureFlags()`/
   * `hasFeatureFlag()` are called with no arguments. See the constructor's `featureFlagGroupOptions`
   * documentation for the full `useSingleGroupSet`/`useMultipleGroupSets` breakdown.
   *
   * Note: the main/single groupset always lives under one fixed internal id (subGroupsets entries
   * always use their own caller-supplied `groupsetId` instead). Reconfiguring it with different
   * groups clears its previously-cached flags automatically, so the next `getAllFeatureFlags()`/
   * `hasFeatureFlag()` call refetches; reconfiguring with the same groups leaves the cache as-is.
   * Other previously-fetched subGroupsets are left untouched (this is additive/upsert, not a
   * wholesale reset).
   *
   * @example
   * ```typescript
   * // Ephemeral, single groupset:
   * upgradeClient.setFeatureFlagGroupOptions({ useSingleGroupSet: { groups: { classId: ['testClass'] } } });
   *
   * // Merged, single groupset:
   * upgradeClient.setFeatureFlagGroupOptions({
   *   useSingleGroupSet: { groups: { classId: ['testClass'] }, includeStoredUserGroups: true },
   * });
   *
   * // Multiple groupsets, with a mainGroupset:
   * upgradeClient.setFeatureFlagGroupOptions({
   *   useMultipleGroupSets: {
   *     mainGroupset: { groups: { schoolId: ['school-a', 'school-b'] } },
   *     subGroupsets: [
   *       { groupsetId: 'school-a', groups: { schoolId: ['school-a'] } },
   *       { groupsetId: 'school-b', groups: { schoolId: ['school-b'] } },
   *     ],
   *   },
   * });
   *
   * // Default behavior (standard stored-user lookup) — also clears any previous configuration:
   * upgradeClient.setFeatureFlagGroupOptions(null);
   * ```
   */
  public setFeatureFlagGroupOptions(
    options: UpGradeClientInterfaces.IFeatureFlagGroupOptions | null | undefined
  ): void {
    if (options == null) {
      this.dataService.clearFeatureFlagsForGroupset(DEFAULT_GROUPSET_ID);
      this.dataService.registerGroupsetDefinition(DEFAULT_GROUPSET_ID, {});
      this.activeConfig = { kind: 'single', groupsetId: DEFAULT_GROUPSET_ID };
      return;
    }

    if (options.useSingleGroupSet && options.useMultipleGroupSets) {
      throw new Error(
        'featureFlagGroupOptions must provide either useSingleGroupSet or useMultipleGroupSets, not both.'
      );
    }

    if (options.useMultipleGroupSets) {
      const { mainGroupset, subGroupsets } = options.useMultipleGroupSets;
      if (!subGroupsets || subGroupsets.length === 0) {
        throw new Error('useMultipleGroupSets.subGroupsets must contain at least one entry.');
      }
      const mainGroupsetId = mainGroupset ? this.registerSingle(mainGroupset, 'mainGroupset') : null;
      const subGroupsetIds = subGroupsets.map((entry) => this.registerSub(entry));
      this.activeConfig = { kind: 'multiple', mainGroupsetId, subGroupsetIds };
      return;
    }

    if (options.useSingleGroupSet) {
      const groupsetId = this.registerSingle(options.useSingleGroupSet, 'useSingleGroupSet');
      this.activeConfig = { kind: 'single', groupsetId };
      return;
    }

    // A truthy but empty options object — treat the same as null (reset to default).
    this.setFeatureFlagGroupOptions(null);
  }

  /**
   * @deprecated Use `setFeatureFlagGroupOptions` with `useSingleGroupSet` instead. Kept as a thin
   * forwarding wrapper — existing callers of this method continue to work unchanged.
   */
  public setFeatureFlagUserGroupsForSession(
    featureFlagOptions: UpGradeClientInterfaces.IFeatureFlagOptions | null | undefined
  ): void {
    if (featureFlagOptions == null) {
      this.setFeatureFlagGroupOptions(null);
      return;
    }
    if (!featureFlagOptions.groupsForSession || featureFlagOptions.includeStoredUserGroups === undefined) {
      throw new Error(
        `${JSON.stringify(
          featureFlagOptions
        )} featureFlagUserGroupsForSession must contain both groupsForSession and includeStoredUserGroups properties.`
      );
    }
    this.setFeatureFlagGroupOptions({
      useSingleGroupSet: {
        groups: featureFlagOptions.groupsForSession,
        includeStoredUserGroups: featureFlagOptions.includeStoredUserGroups,
      },
    });
  }

  /**
   * This will initialize user and metadata for the user. It will return the user object with id, group, and working group.
   * NOTE: A user must be initialized at least once before calling any other methods.
   * Else, you will see "Experiment user not defined" errors when other SDK methods are called.
   *
   * @example
   * ```typescript
   * const group: Record<string, Array<string>> = {
   *   classId: ['class1', 'class2'],
   *   districtId: ['district1', 'district2'],
   * }
   *
   * const workingGroup: Record<string, string> = {
   *  classId: 'class1',
   *  districtId: 'district2',
   * }
   *
   * const initResponse: UpGradeClientInterfaces.IUser[] = await upgradeClient.init();
   * const initResponse: UpGradeClientInterfaces.IUser[] = await upgradeClient.init(group);
   * const initResponse: UpGradeClientInterfaces.IUser[] = await upgradeClient.init(group, workingGroup);
   *
   * ```
   */
  async init(
    group?: Record<string, Array<string>>,
    workingGroup?: Record<string, string>
  ): Promise<UpGradeClientInterfaces.IExperimentUser> {
    return await this.apiService.init(group, workingGroup);
  }

  /**
   * Will set the group membership(s) for the user and return the user object with updated working group.
   *
   * @example
   * ```typescript
   * const group: Record<string, Array<string>> = {
   *   classId: ['class1', 'class2'],
   *   districtId: ['district1', 'district2'],
   * }
   *
   * const groupMembershipResponse: UpGradeClientInterfaces.IUser[] = await upgradeClient.setGroupMembership(group);
   * ```
   */
  async setGroupMembership(group: Record<string, Array<string>>): Promise<UpGradeClientInterfaces.IExperimentUser> {
    let response: UpGradeClientInterfaces.IExperimentUser = await this.apiService.setGroupMembership(group);
    // If it does not throw error from setGroupMembership
    this.dataService.setGroup(group);
    response = {
      ...response,
      workingGroup: this.dataService.getWorkingGroup(),
    };
    return response;
  }

  /**
   * Will set the working group(s) for the user and return the user object with updated working group.
   *
   * @example
   * ```typescript
   * const workingGroup: Record<string, string> = {
   *  classId: 'class1',
   *  districtId: 'district2',
   * }
   *
   * const workingGroupResponse: UpGradeClientInterfaces.IUser[] = await upgradeClient.setWorkingGroup(workingGroup);
   * ```
   */
  async setWorkingGroup(workingGroup: Record<string, string>): Promise<UpGradeClientInterfaces.IExperimentUser> {
    let response: UpGradeClientInterfaces.IExperimentUser = await this.apiService.setWorkingGroup(workingGroup);
    // If it does not throw error from setWorkingGroup
    this.dataService.setWorkingGroup(workingGroup);
    response = {
      ...response,
      group: this.dataService.getGroup(),
    };
    return response;
  }

  /**
   * This will return all the assignment for the given context.
   * The return object contains site, target, experimentType, assignedCondition array and assignedFactor array(optional)
   * Here assignedCondition and assignedFactors(For Factorial-experiment) are arrays
   *    They will return a stack of condition user will be assigned in that order
   * For With-in subjects these stacks will be contain all conditions according to the chosen `Condition-Order`
   * For Between subjects experiment both stack will return array containing single condition.
   * @param options.ignoreCache If true, it will ignore the cached experiment assignments and fetch fresh data from the API.
   *  This is useful when you want to ensure you have the latest assignments.
   *  If false, it will return the cached assignments if available.
   * @example
   * ```typescript
   * const userId = "User1"
   * const context = "mathia"
   *
   * const getAllResponse: IExperimentAssignment[] = await upgradeClient.getAllExperimentConditions();
   * ```
   */
  async getAllExperimentConditions(options = { ignoreCache: false }): Promise<IExperimentAssignment[]> {
    let response: IExperimentAssignment[] = options.ignoreCache
      ? null
      : await this.dataService.getExperimentAssignmentData();
    if (response == null) {
      response = await this.apiService.getAllExperimentConditions();
      if (Array.isArray(response)) {
        this.dataService.setExperimentAssignmentData(response);
      }
    }
    return response;
  }

  /**
   * Given a site and optional target, return the Assignment this decision point
   * NOTE: If getAllExperimentConditions() has not been called, this will call it first.
   * NOTE ALSO: If getAllExperimentConditions() has been called, this will return the cached result and not make a network call.
   *
   * @example
   * ```typescript
   * const assignmentResponse: Assignment = await upgradeClient.getDecisionPointAssignment(site);
   * const assignmentResponse: Assignment = await upgradeClient.getDecisionPointAssignment(site, target);
   * ```
   */

  async getDecisionPointAssignment(site: string, target = ''): Promise<Assignment | null> {
    await this.getAllExperimentConditions();

    if (this.dataService.getExperimentAssignmentData()) {
      const experimentAssignment = this.dataService.findExperimentAssignmentBySiteAndTarget(site, target);

      const assignment = new Assignment(experimentAssignment, this.apiService);

      return assignment;
    } else {
      return null;
    }
  }

  /**
   * Will record ("mark") that a user has "seen" a condition at the given decision point (site + target).
   *
   * NOTE: This method may be deprecated in favor of Assignment.markDecisionPoint() in a future release.
   *
   * Marking the decision point will record the user's condition assignment, regardless of whether the user is enrolled in an experiment.
   *
   * Can be called with positional arguments (original form) or a single options object:
   *
   * @example
   * ```ts
   * import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';
   *
   * // Options object form (target is optional — defaults to ''):
   * const markResponse = await upgradeClient.markDecisionPoint({
   *   site: 'dashboard',
   *   condition: 'variant_x',
   *   status: MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
   * });
   *
   * // Options object form with all fields.
   * const markResponse = await upgradeClient.markDecisionPoint({
   *   site: 'dashboard',
   *   target: 'experimental button',
   *   condition: 'variant_x',
   *   status: MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED,
   *   uniquifier: 'some-unique-id',
   *   clientError: 'variant not recognized',
   * });
   *
   * // Positional form (original, for backward compatibility):
   * * Note, this signature is being deprecated in favor of the options object.
   * * One reason is because target, while optional, must still be provided as an empty value if not used (will be normalized to '' if null/undefined).
   * const markResponse = await upgradeClient.markDecisionPoint(site, target, condition, MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);
   * ```
   *
   * Note*: mark can also be called via `Assignment.markDecisionPoint()` when returning an assignment from `getDecisionPointAssignment()`:
   * ```ts
   * const assignment: Assignment = await upgradeClient.getDecisionPointAssignment(site, target) // or await upgradeClient.getDecisionPointAssignment(site);
   * const markResponse = await assignment.markDecisionPoint(MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);
   * ```
   */

  async markDecisionPoint(
    options: UpGradeClientInterfaces.IMarkDecisionPointOptions
  ): Promise<UpGradeClientInterfaces.IMarkDecisionPoint>;
  /** @deprecated Use the options object overload: markDecisionPoint(options: IMarkDecisionPointOptions) */
  async markDecisionPoint(
    site: string,
    target: string,
    condition: string | null,
    status: MARKED_DECISION_POINT_STATUS,
    uniquifier?: string,
    clientError?: string
  ): Promise<UpGradeClientInterfaces.IMarkDecisionPoint>;
  async markDecisionPoint(
    siteOrOptions: string | UpGradeClientInterfaces.IMarkDecisionPointOptions,
    target?: string,
    condition?: string | null,
    status?: MARKED_DECISION_POINT_STATUS,
    uniquifier?: string,
    clientError?: string
  ): Promise<UpGradeClientInterfaces.IMarkDecisionPoint> {
    let resolvedSite: string;
    let resolvedTarget: string;
    let resolvedCondition: string | null;
    let resolvedStatus: MARKED_DECISION_POINT_STATUS;
    let resolvedUniquifier: string | undefined;
    let resolvedClientError: string | undefined;

    if (typeof siteOrOptions === 'object') {
      resolvedSite = siteOrOptions.site;
      resolvedTarget = siteOrOptions.target ?? '';
      resolvedCondition = siteOrOptions.condition ?? null;
      resolvedStatus = siteOrOptions.status;
      resolvedUniquifier = siteOrOptions.uniquifier;
      resolvedClientError = siteOrOptions.clientError;
    } else {
      resolvedSite = siteOrOptions;
      resolvedTarget = target ?? '';
      resolvedCondition = condition ?? null;
      resolvedStatus = status;
      resolvedUniquifier = uniquifier;
      resolvedClientError = clientError;
    }

    if (this.dataService.getExperimentAssignmentData() == null) {
      await this.getAllExperimentConditions();
    }
    return await this.apiService.markDecisionPoint({
      site: resolvedSite,
      target: resolvedTarget,
      condition: resolvedCondition,
      status: resolvedStatus,
      uniquifier: resolvedUniquifier,
      clientError: resolvedClientError,
    });
  }

  /**
   * @deprecated
   * Please use "markDecisionPoint" instead. This is just a name change, the functionality is the same, but could be removed in future.
   *
   * Will record ("mark") that a user has "seen" a condition at the given decision point (site + target).
   *
   * NOTE: This method may be deprecated in favor of Assignment.markDecisionPoint() in a future release.
   *
   * Marking the decision point will record the user's condition assignment, regardless of whether the user is enrolled in an experiment.
   *
   * @param site
   * @param target
   * @param condition `condition` is the string identifier that the user was assigned to. If none is provided, the condition will be default (null)
   *
   * @param status `status` signifies a client application's note on what it did in the code with condition assignment that Upgrade provided.
   *  Status can be one of the following:
   *
   * ```ts
   * export enum MARKED_DECISION_POINT_STATUS {
   *   CONDITION_APPLIED = 'condition applied',
   *   CONDITION_FAILED_TO_APPLY = 'condition not applied',
   *   NO_CONDITION_ASSIGNED = 'no condition assigned',
   * }
   * ```
   *
   * @param uniquifier A `uniquifier` unique string can be sent along to help tie a user's logged metrics to a specific marked condition.
   * This identifier will also need to be sent when calling `upgradeClient.log()`
   * This is required for 'within-subjects' experiments.
   *
   * @param clientError The client can also send along an additional `clientError` string to log context as to why a condition was not applied.
   *
   * @example
   * ```ts
   * import { MARKED_DECISION_POINT_STATUS } from 'upgrade_types';
   *
   * const site = 'dashboard';
   * const target = 'experimental button';
   * const condition = 'variant_x'; // send null if no condition / no experiment is running / error
   * const status: MARKED_DECISION_POINT_STATUS = MARKED_DECISION_POINT_STATUS.CONDITION_FAILED_TO_APPLY
   * const clientError = 'variant not recognized'; //optional
   *
   * const markResponse = await upgradeClient.markExperimentPoint(site, target, condition, MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);
   * ```
   *
   * Note*: mark can also be called via `Assignment.markDecisionPoint()` when returning an assignment from `getDecisionPointAssignment()`:
   * ```ts
   * const assignment: Assignment[] = await upgradeClient.getDecisionPointAssignment(site, target);
   * const markResponse = await assignment.markDecisionPoint(MARKED_DECISION_POINT_STATUS.CONDITION_APPLIED);
   * ```
   */

  markExperimentPoint = this.markDecisionPoint;

  /**
   * Fetches feature flags per the active configuration (see `setFeatureFlagGroupOptions`), or an
   * ad-hoc override for this call only.
   *
   * With no arguments (or `ignoreCache`/nothing else set): uses the active configuration.
   * `useSingleGroupSet` config → flat `string[]`. `useMultipleGroupSets` config →
   * `{ mainGroupset?: string[]; subGroupsets: Record<string, string[]> }`. Cache hits are served
   * from cache; cache misses are aggregated into a single batched request.
   *
   * Passing `useSingleGroupSet`/`useMultipleGroupSets` directly evaluates that ad-hoc configuration
   * for this call only, without touching the active configuration — the same shape-in/shape-out
   * rule applies. `ignoreCache: true` forces a refetch of whatever's relevant to this call, upserted
   * into the cache; everything else already fetched is left untouched.
   *
   * @example
   * ```typescript
   * const featureFlags = await upgradeClient.getAllFeatureFlags();
   * console.log(featureFlags); // ['feature1', 'feature2', 'feature3']
   *
   * const bySchool = await upgradeClient.getAllFeatureFlags({
   *   useSingleGroupSet: { groups: { schoolId: ['school-a'] } },
   * });
   * console.log(bySchool); // ['feature1'] — still a flat array, since the input was singular
   * ```
   */
  async getAllFeatureFlags(
    options: UpGradeClientInterfaces.IGetAllFeatureFlagsOptions = {}
  ): Promise<string[] | UpGradeClientInterfaces.IMultiGroupSetFeatureFlagsResult> {
    const { ignoreCache = false, useSingleGroupSet, useMultipleGroupSets } = options;

    if (useSingleGroupSet && useMultipleGroupSets) {
      throw new Error('getAllFeatureFlags must be given either useSingleGroupSet or useMultipleGroupSets, not both.');
    }

    if (useMultipleGroupSets) {
      const { mainGroupset, subGroupsets } = useMultipleGroupSets;
      if (!subGroupsets || subGroupsets.length === 0) {
        throw new Error('useMultipleGroupSets.subGroupsets must contain at least one entry.');
      }
      const mainGroupsetId = mainGroupset ? this.registerSingle(mainGroupset, 'mainGroupset') : null;
      const subGroupsetIds = subGroupsets.map((entry) => this.registerSub(entry));
      return this.fetchMultiple(mainGroupsetId, subGroupsetIds, ignoreCache);
    }

    if (useSingleGroupSet) {
      const groupsetId = this.registerSingle(useSingleGroupSet, 'useSingleGroupSet');
      return this.fetchSingle(groupsetId, ignoreCache);
    }

    if (this.activeConfig.kind === 'single') {
      return this.fetchSingle(this.activeConfig.groupsetId, ignoreCache);
    }
    return this.fetchMultiple(this.activeConfig.mainGroupsetId, this.activeConfig.subGroupsetIds, ignoreCache);
  }

  private async fetchSingle(groupsetId: string, ignoreCache: boolean): Promise<string[]> {
    if (!ignoreCache) {
      const cached = this.dataService.getFeatureFlagsForGroupset(groupsetId);
      if (cached != null) {
        return cached;
      }
    }

    const definition = this.dataService.getGroupsetDefinition(groupsetId) ?? {};
    // definition.groups is undefined for the default (no options) groupset — omit useSingleGroupSet
    // entirely in that case so the backend's plain stored-user lookup runs, rather than sending
    // `useSingleGroupSet: {}`, which fails validation (groups is required on that shape).
    const response = await this.apiService.getAllFeatureFlags(
      definition.groups
        ? {
            useSingleGroupSet: {
              groups: definition.groups,
              includeStoredUserGroups: definition.includeStoredUserGroups,
            },
          }
        : {}
    );
    const flags = Array.isArray(response) ? response : [];
    this.dataService.setFeatureFlagsForGroupset(groupsetId, flags);
    return flags;
  }

  private async fetchMultiple(
    mainGroupsetId: string | null,
    subGroupsetIds: string[],
    ignoreCache: boolean
  ): Promise<UpGradeClientInterfaces.IMultiGroupSetFeatureFlagsResult> {
    const allIds = [...(mainGroupsetId ? [mainGroupsetId] : []), ...subGroupsetIds];
    const idsToFetch = ignoreCache
      ? allIds
      : allIds.filter((id) => this.dataService.getFeatureFlagsForGroupset(id) == null);

    if (idsToFetch.length) {
      const mainNeedsFetch = mainGroupsetId != null && idsToFetch.includes(mainGroupsetId);
      const subIdsToFetch = idsToFetch.filter((id) => id !== mainGroupsetId);

      if (mainNeedsFetch && subIdsToFetch.length === 0) {
        // Only the mainGroupset needs (re)fetching — the plain single-groupset shape covers it,
        // since the backend requires useMultipleGroupSets.subGroupsets to be non-empty.
        const mainDef = this.dataService.getGroupsetDefinition(mainGroupsetId) ?? {};
        const response = await this.apiService.getAllFeatureFlags({
          useSingleGroupSet: { groups: mainDef.groups, includeStoredUserGroups: mainDef.includeStoredUserGroups },
        });
        this.dataService.setFeatureFlagsForGroupset(mainGroupsetId, Array.isArray(response) ? response : []);
      } else {
        const response = await this.apiService.getAllFeatureFlags({
          useMultipleGroupSets: {
            ...(mainNeedsFetch
              ? {
                  mainGroupset: (this.dataService.getGroupsetDefinition(mainGroupsetId) ??
                    {}) as UpGradeClientInterfaces.ISingleGroupSetOptions,
                }
              : {}),
            subGroupsets: subIdsToFetch.map(
              (id) =>
                ({
                  groupsetId: id,
                  ...(this.dataService.getGroupsetDefinition(id) ?? {}),
                } as UpGradeClientInterfaces.ISubGroupSetOptions)
            ),
          },
        });
        if (response && !Array.isArray(response)) {
          if (response.mainGroupset && mainGroupsetId) {
            this.dataService.setFeatureFlagsForGroupset(mainGroupsetId, response.mainGroupset);
          }
          this.dataService.setFeatureFlagsForGroupsets(response.subGroupsets ?? {});
        }
      }
    }

    const result: UpGradeClientInterfaces.IMultiGroupSetFeatureFlagsResult = { subGroupsets: {} };
    if (mainGroupsetId) {
      result.mainGroupset = this.dataService.getFeatureFlagsForGroupset(mainGroupsetId) ?? [];
    }
    subGroupsetIds.forEach((id) => {
      result.subGroupsets[id] = this.dataService.getFeatureFlagsForGroupset(id) ?? [];
    });
    return result;
  }

  /**
   * Checks if a specific feature flag is enabled.
   *
   * With no `groupsetId`: uses the active configuration. `useSingleGroupSet` (or default) mode —
   * no id needed. `useMultipleGroupSets` mode — resolves to `mainGroupset` if one is configured;
   * throws otherwise, since there's nothing to default to.
   *
   * With a `groupsetId`: reads that groupset's cache; on a miss, rehydrates it by refetching just
   * that one groupset, using whatever definition was registered for it (from construction,
   * `setFeatureFlagGroupOptions`, or a prior `getAllFeatureFlags` call) — throws if the id was
   * never registered at all.
   *
   * @example
   * ```typescript
   * const isFeatureEnabled = await upgradeClient.hasFeatureFlag('feature1');
   * const isEnabledForSchool = await upgradeClient.hasFeatureFlag('feature1', 'school-a');
   * ```
   */
  public async hasFeatureFlag(key: string, groupsetId?: string): Promise<boolean> {
    const resolvedGroupsetId = groupsetId ?? this.resolveDefaultGroupsetId();
    await this.ensureGroupsetFetched(resolvedGroupsetId);
    return this.dataService.hasFeatureFlagForGroupset(key, resolvedGroupsetId);
  }

  private resolveDefaultGroupsetId(): string {
    if (this.activeConfig.kind === 'single') {
      return this.activeConfig.groupsetId;
    }
    if (this.activeConfig.mainGroupsetId) {
      return this.activeConfig.mainGroupsetId;
    }
    throw new Error(
      'hasFeatureFlag(key) requires a groupsetId when useMultipleGroupSets has no mainGroupset configured — use hasFeatureFlag(key, groupsetId).'
    );
  }

  /** Fetches a single groupset by id if it isn't already cached, using its registered definition. */
  private async ensureGroupsetFetched(groupsetId: string): Promise<void> {
    if (this.dataService.getFeatureFlagsForGroupset(groupsetId) != null) {
      return;
    }

    const definition: IGroupsetDefinition = this.dataService.getGroupsetDefinition(groupsetId);
    if (!definition) {
      throw new Error(`No feature flags have been fetched or configured for groupset id "${groupsetId}".`);
    }

    // Rehydrating a single id (whether it plays a "main" or "sub" role) is always just a plain
    // single-groupset evaluation — the multi-groupset framing doesn't matter for one id alone.
    // definition.groups is undefined only for the default groupset — omit useSingleGroupSet
    // entirely in that case (see fetchSingle for why sending `{}` would fail validation).
    const response = await this.apiService.getAllFeatureFlags(
      definition.groups
        ? {
            useSingleGroupSet: {
              groups: definition.groups,
              includeStoredUserGroups: definition.includeStoredUserGroups,
            },
          }
        : {}
    );
    this.dataService.setFeatureFlagsForGroupset(groupsetId, Array.isArray(response) ? response : []);
  }

  /**
   * Will report user outcome metrics to Upgrade.
   * Please see https://upgrade-platform.gitbook.io/docs/developer-guide/reference/metrics for more information.
   *
   * @example
   * ```ts
   * const metrics: ILogInput[] = [
   *     {
   *       userId,
   *       timestamp: '2022-03-03T19:49:00.496',
   *       metrics: {
   *       attributes: {
   *         totalTimeSeconds: 41834,
   *         totalMasteryWorkspacesCompleted: 15,
   *         totalConceptBuildersCompleted: 17,
   *         totalMasteryWorkspacesGraduated: 15,
   *         totalSessions: 50,
   *         totalProblemsCompleted: 249,
   *       },
   *       groupedMetrics: [
   *         {
   *           groupClass: 'conceptBuilderWorkspace',
   *           groupKey: 'graphs_of_functions',
   *           groupUniquifier: '2022-02-03T19:48:53.861Z',
   *           attributes: {
   *             timeSeconds: 488,
   *             hintCount: 2,
   *             errorCount: 15,
   *             completionCount: 1,
   *             workspaceCompletionStatus: 'GRADUATED',
   *             problemsCompleted: 4,
   *           },
   *         },
   *       ],
   *     },
   *   ];
   *
   * const logResponse: ILog[] = await upgradeClient.metrics(metrics);
   * ```
   */
  async log(value: ILogInput[]): Promise<UpGradeClientInterfaces.ILogResponse[]> {
    return await this.apiService.log(value);
  }

  /**
 * Will report Caliper user outcome metrics to Upgrade, same as log() but with Caliper envelope.
 * 
 * @example
 * ```ts
 * const logRequest: CaliperEnvelope = {
      sensor: 'test',
      sendTime: 'test',
      dataVersion: 'test',
      data: [],
    };
 *
 *
 *  const logCaliperResponse: ILog[] = await upgradeClient.logCaliper(logRequest);
 * 
 * ```
 */
  async logCaliper(value: CaliperEnvelope): Promise<UpGradeClientInterfaces.ILogResponse[]> {
    return await this.apiService.logCaliper(value);
  }

  /**
   * Will set an array of alternate user ids for the user.
   *
   * @example
   * ```ts
   * const aliases: string[] = ['alias1', 'alias2'];
   *
   * const setAltUserIdsResponse: IExperimentUserAliases[] = await upgradeClient.setAltUserIds(aliases);
   * ```
   */
  async setAltUserIds(altUserIds: string[]): Promise<IUserAliases> {
    return await this.apiService.setAltUserIds(altUserIds);
  }

  /**
   * Sends a binary reward signal for an adaptive experiment (Mooclet).
   *
   * This method allows sending reward feedback (SUCCESS or FAILURE) for adaptive experiments.
   * The reward is used by the adaptive algorithm to update its learning model and improve future assignments.
   *
   * **Reward Values:**
   * You can pass reward values in two ways:
   * - As string literals: 'SUCCESS' or 'FAILURE'
   * - Using the enum: UpgradeClient.BINARY_REWARD_VALUE.SUCCESS or UpgradeClient.BINARY_REWARD_VALUE.FAILURE
   *
   * **Lookup Methods:**
   *
   * The method supports two ways to identify the experiment:
   *
   * 1. **Direct Lookup** - Provide the `experimentId` directly
   * 2. **Decision Point Lookup** - Provide `context` and `decisionPoint` (site and target) to look up the experiment
   *
   * At least one of these methods must be provided.
   *
   * @example
   * ```ts
   * // Example 1: Using string literals with experimentId
   * const response = await upgradeClient.sendReward({
   *   rewardValue: 'SUCCESS',
   *   experimentId: 'exp_adaptive_123'
   * });
   * ```
   *
   * @example
   * ```ts
   * // Example 2: Using the enum with experimentId
   * const response = await upgradeClient.sendReward({
   *   rewardValue: UpgradeClient.BINARY_REWARD_VALUE.SUCCESS,
   *   experimentId: 'exp_adaptive_123'
   * });
   * ```
   *
   * @example
   * ```ts
   * // Example 3: Using decision point lookup with string literals
   * const response = await upgradeClient.sendReward({
   *   rewardValue: 'FAILURE',
   *   context: 'learning-module',
   *   decisionPoint: {
   *     site: 'math-course',
   *     target: 'problem-set-1'
   *   }
   * });
   * ```
   *
   * @example
   * ```ts
   * // Example 4: Using decision point lookup with enum
   * const response = await upgradeClient.sendReward({
   *   rewardValue: UpgradeClient.BINARY_REWARD_VALUE.FAILURE,
   *   context: 'learning-module',
   *   decisionPoint: {
   *     site: 'math-course',
   *     target: 'problem-set-1'
   *   }
   * });
   * ```
   *  * @example
   * ```ts
   * // Example 5: Using decision point without target
   * const response = await upgradeClient.sendReward({
   *   rewardValue: UpgradeClient.BINARY_REWARD_VALUE.FAILURE,
   *   context: 'learning-module',
   *   decisionPoint: {
   *     site: 'math-course'
   *   }
   * });
   * ```
   */
  async sendReward(params: {
    rewardValue: 'SUCCESS' | 'FAILURE';
    experimentId?: string;
    context?: string;
    decisionPoint?: UpGradeClientInterfaces.IDecisionPoint;
  }): Promise<UpGradeClientInterfaces.ISendRewardResponse> {
    return await this.apiService.sendReward(params);
  }
}
