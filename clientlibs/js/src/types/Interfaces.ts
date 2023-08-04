/* eslint-disable @typescript-eslint/no-namespace */
import { IMetricMetaData, MARKED_DECISION_POINT_STATUS } from 'upgrade_types';
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
  export interface IResponse {
    status: boolean;
    data?: any;
    message?: any;
  }

  export interface IRequestOptions {
    headers: object;
    method: UpGradeClientEnums.REQUEST_METHOD;
    keepalive: boolean;
    body?: string;
  }

  export interface IMarkDecisionPointParams {
    site: string;
    target: string;
    condition: string;
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
