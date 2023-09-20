/* eslint-disable @typescript-eslint/no-namespace */
import { IMetricMetaData, MARKED_DECISION_POINT_STATUS } from 'upgrade_types';

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

  export interface ILogResponse {
    createdAt?: string;
    updatedAt?: string;
    versionNumber?: number;
    id: string;
    uniquifier: string;
    timeStamp: string;
    data: any;
    userId: string;
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
