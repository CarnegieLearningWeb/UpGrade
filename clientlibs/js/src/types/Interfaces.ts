/* eslint-disable @typescript-eslint/no-namespace */
import { IMetricMetaData, MARKED_DECISION_POINT_STATUS, IExperimentAssignmentv5, ILogInput } from 'upgrade_types';
import { UpGradeClientEnums } from './enums';

export namespace UpGradeClientInterfaces {
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
  }

  export interface IEndpoints {
    init: string;
    getAllExperimentConditions: string;
    markDecisionPoint: string;
    setGroupMemberShip: string;
    setWorkingGroup: string;
    failedExperimentPoint: string;
    getAllFeatureFlag: string;
    log: string;
    logCaliper: string;
    altUserIds: string;
    addMetrics: string;
  }

  export interface IClientState {
    config: IConfig;
    allExperimentAssignmentData: IExperimentAssignmentv5[];
  }

  export interface IResponse {
    status: boolean;
    data?: any;
    message?: any;
  }

  export interface IRequestOptions {
    headers: object;
    method: UpGradeClientEnums.REQUEST_TYPES;
    keepalive: boolean;
    body?: string;
  }

  export interface ApiServiceRequestParams {
    url: string;
    requestType: UpGradeClientEnums.REQUEST_TYPES;
    requestBody?: any;
    options?: any;
  }

  export interface MarkDecisionPointParams {
    site: string;
    target: string;
    condition: string;
    status: MARKED_DECISION_POINT_STATUS;
    uniquifier?: string;
    clientError?: string;
  }

  export interface IGetAllExperimentConditionsRequestBody {
    userId: string;
    context: string;
  }

  export interface ISetGroupMembershipRequestBody {
    id: string;
    group: IExperimentUserGroup;
  }

  export interface ISetWorkingGroupRequestBody {
    id: string;
    workingGroup: IExperimentUserWorkingGroup;
  }

  export interface ISetAltIdsRequestBody {
    userId: string;
    aliases: IExperimentUserAliases;
  }

  export interface IExperimentUser {
    id: string;
    group?: IExperimentUserGroup;
    workingGroup?: IExperimentUserWorkingGroup;
  }
  export type IExperimentUserGroup = Record<string, Array<string>>;
  export type IExperimentUserWorkingGroup = Record<string, string>;
  export type IExperimentUserAliases = string[];

  export interface IMarkDecisionPointRequestBody {
    userId: string;
    status: MARKED_DECISION_POINT_STATUS;
    data: {
      site: string;
      target: string;
      assignedCondition: { conditionCode: string; experimentId?: string };
    };
    uniquifier?: string;
    clientError?: string;
  }
  export interface IMarkDecisionPoint {
    id: string;
    site: string;
    target: string;
    userId: string;
    experimentId: string;
  }

  export interface ILogRequestBody {
    userId: string;
    value: ILogInput[];
  }

  export interface ILog {
    id: string;
    data: any;
    metrics: IMetric[];
    user: IExperimentUser;
    timeStamp: string;
    uniquifier: string;
  }

  export interface IMetric {
    key: string;
    type: IMetricMetaData;
    allowedData: string[];
  }

  export interface IExperimentUserAliasesResponse {
    userId: string;
    aliases: string[];
  }

  export interface IHttpClientWrapperRequestOptions {
    headers?: object;
  }

  export type IHttpClientWrapper = {
    get: (url: string, options: IHttpClientWrapperRequestOptions) => any;
    post: <UpgradeRequestBodyType>(
      url: string,
      requestBody: UpgradeRequestBodyType,
      options: IHttpClientWrapperRequestOptions
    ) => any;
    patch: <UpgradeRequestBodyType>(
      url: string,
      requestBody: UpgradeRequestBodyType,
      options: IHttpClientWrapperRequestOptions
    ) => any;
  };
}
