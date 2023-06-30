/* eslint-disable @typescript-eslint/no-namespace */
import { SERVER_ERROR, IMetricMetaData } from 'upgrade_types';
import { Types } from './enums';

export namespace Interfaces {
  export interface IConfig {
    hostURL: string;
    userId: string;
    api: any;
  }

  export interface IResponse {
    status: boolean;
    data?: any;
    message?: any;
  }

  export interface IRequestOptions {
    headers: object;
    method: Types.REQUEST_TYPES;
    keepalive: boolean;
    body?: string;
  }

  export interface IUserGroup {
    group?: Map<string, string[]>;
    workingGroup?: Map<string, string>;
  }

  export interface IUser {
    id: string;
    group?: Record<string, Array<string>>;
    workingGroup?: Record<string, string>;
  }

  export interface IMarkExperimentPoint {
    id: string;
    site: string;
    target: string;
    userId: string;
    experimentId: string;
  }

  export interface IFailedExperimentPoint {
    type: SERVER_ERROR;
    message: string;
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

  export interface IExperimentUser {
    id: string;
    group: object;
    workingGroup: object;
  }

  export interface IExperimentUserAliases {
    userId: string;
    aliases: string[];
  }

  export interface ICustomHttpClient {
    [Types.REQUEST_TYPES.GET](url: string, options?: any): Promise<Interfaces.IResponse>;
    [Types.REQUEST_TYPES.POST](url: string, data: any, options?: any): Promise<Interfaces.IResponse>;
    [Types.REQUEST_TYPES.PATCH](url: string, data: any, options?: any): Promise<Interfaces.IResponse>;
  }
}
