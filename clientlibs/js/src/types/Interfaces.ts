/* eslint-disable @typescript-eslint/no-namespace */
import { IMetricMetaData, MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

export namespace UpGradeClientInterfaces {
  // this namespace should be for consumer facing interface
  // IConfig is really only internally used and could be confusing to consumers, should be moved in a future major version update
  export interface IConfig {
    hostURL: string;
    userId: string;
    context: string;
    apiVersion: string;
    clientSessionId?: string;
    token?: string;
    httpClient?: UpGradeClientInterfaces.IHttpClientWrapper;
  }

  export interface IConfigOptions {
    token?: string;
    clientSessionId?: string;
    httpClient?: UpGradeClientInterfaces.IHttpClientWrapper;
    featureFlagGroupOptions?: IFeatureFlagGroupOptions | null;
    /** @deprecated Use `featureFlagGroupOptions` with `useSingleGroupSet` instead. */
    featureFlagUserGroupsForSession?: IFeatureFlagOptions | null;
  }

  /** @deprecated Use `useSingleGroupSet` (via `featureFlagGroupOptions`) instead. */
  export interface IFeatureFlagOptions {
    groupsForSession: Record<string, string[]>;
    includeStoredUserGroups: boolean;
  }

  /**
   * One groupset: which groups to evaluate feature flags under, and whether to merge them with
   * the user's stored groups.
   *
   * - Omit `groups` entirely (i.e. omit the whole `useSingleGroupSet`/entry) → stored-user mode.
   * - `groups` alone, or with `includeStoredUserGroups: false` → ephemeral mode (caller-provided
   *   groups only). `includeStoredUserGroups` is optional — omitting it is the same as `false`.
   * - `groups` + `includeStoredUserGroups: true` → merged mode (stored + caller-provided groups).
   *   `true` must always be explicit; it is never inferred.
   */
  export interface ISingleGroupSetOptions {
    groups: Record<string, string[]>;
    includeStoredUserGroups?: boolean;
  }

  /** One named entry in `useMultipleGroupSets.subGroupsets` — `groupsetId` is required and is the
   * key both the response and `hasFeatureFlag(key, groupsetId)` use to address this entry. */
  export interface ISubGroupSetOptions extends ISingleGroupSetOptions {
    groupsetId: string;
  }

  export interface IMultipleGroupSetsOptions {
    /**
     * Optional. When provided, this groupset's flags are what `hasFeatureFlag(key)` (no id)
     * resolves to, and `getAllFeatureFlags()` returns them under the `mainGroupset` key. When
     * omitted, `hasFeatureFlag(key)` with no id throws — there is nothing to default to.
     */
    mainGroupset?: ISingleGroupSetOptions;
    /** At least one named groupset, fetched alongside `mainGroupset` in a single request. */
    subGroupsets: ISubGroupSetOptions[];
  }

  /**
   * Configures how `/v6/featureflag` requests are evaluated — exactly one of `useSingleGroupSet`
   * (the classic one-groupset approach: `getAllFeatureFlags()` returns a flat `string[]` and
   * `hasFeatureFlag(key)` needs no id) or `useMultipleGroupSets` (`getAllFeatureFlags()` returns
   * `{ mainGroupset?: string[]; subGroupsets: Record<string, string[]> }`).
   */
  export interface IFeatureFlagGroupOptions {
    useSingleGroupSet?: ISingleGroupSetOptions;
    useMultipleGroupSets?: IMultipleGroupSetsOptions;
  }

  export interface IGetAllFeatureFlagsOptions {
    ignoreCache?: boolean;
    /** Ad-hoc single-groupset override for this call only — does not touch persistent config. */
    useSingleGroupSet?: ISingleGroupSetOptions;
    /** Ad-hoc multiple-groupsets override for this call only — does not touch persistent config. */
    useMultipleGroupSets?: IMultipleGroupSetsOptions;
  }

  /** `getAllFeatureFlags()`'s return shape when `useMultipleGroupSets` is active. */
  export interface IMultiGroupSetFeatureFlagsResult {
    mainGroupset?: string[];
    subGroupsets: Record<string, string[]>;
  }

  export interface IResponse {
    status: boolean;
    data?: any;
    message?: any;
  }

  export interface IMarkDecisionPointParams {
    site: string;
    target: string;
    condition: string;
    status: MARKED_DECISION_POINT_STATUS;
    uniquifier?: string;
    clientError?: string;
  }

  export interface IMarkDecisionPointOptions {
    site: string;
    target?: string;
    condition?: string | null;
    status: MARKED_DECISION_POINT_STATUS;
    uniquifier?: string;
    clientError?: string;
  }
  export interface IExperimentUser {
    id: string;
    group?: IExperimentUserGroup;
    workingGroup?: IExperimentUserWorkingGroup;
  }
  export type IExperimentUserGroup = Record<string, Array<string>>;
  export type IExperimentUserWorkingGroup = Record<string, string>;
  export type IExperimentUserAliases = string[];
  export interface IMarkDecisionPoint {
    id: string;
    site: string;
    target: string;
    userId: string;
    experimentId: string;
  }

  export interface ILog {
    id: string;
    data: any;
    metrics: IMetric[];
    user: IExperimentUser;
    timeStamp: string;
    uniquifier: string;
  }

  export interface ILogResponse {
    createdAt?: string;
    updatedAt?: string;
    versionNumber?: number;
    id: string;
    uniquifier: string;
    timeStamp: string;
    data: any;
  }

  export interface IMetric {
    key: string;
    type: IMetricMetaData;
    allowedData: string[];
  }

  export interface IExperimentUserAliasesResponse {
    userId: string;
    aliases: IExperimentUserAliases;
  }

  export interface IDecisionPoint {
    site: string;
    target?: string;
  }

  export interface ISendRewardResponse {
    message: string;
    request: {
      rewardValue: 'SUCCESS' | 'FAILURE';
      experimentId?: string;
      context?: string;
      decisionPoint?: IDecisionPoint;
    };
  }

  export interface IHttpClientWrapperRequestConfig {
    headers?: {
      [key: string]: string | string[];
    };
    withCredentials?: boolean;
  }
  export interface IHttpClientWrapper {
    config?: IHttpClientWrapperRequestConfig;
    doGet: <ResponseType>(url: string, options: IHttpClientWrapperRequestConfig) => Promise<ResponseType>;
    doPost: <ResponseType, RequestBodyType>(
      url: string,
      body: RequestBodyType,
      options: IHttpClientWrapperRequestConfig
    ) => Promise<ResponseType>;
    doPatch: <ResponseType, RequestBodyType>(
      url: string,
      body: RequestBodyType,
      options: IHttpClientWrapperRequestConfig
    ) => Promise<ResponseType>;
  }
}
