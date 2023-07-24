/* eslint-disable @typescript-eslint/no-namespace */
import { SERVER_ERROR, IMetricMetaData, MARKED_DECISION_POINT_STATUS, IExperimentAssignmentv5 } from 'upgrade_types';
import { UpGradeClientEnums } from './enums';

export namespace UpGradeClientInterfaces {
  export interface IConfig {
    hostURL: string;
    userId: string;
    api: IEndpoints;
    clientSessionId?: string;
    token?: string;
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
  };

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

  export interface IUserGroup {
    group?: Map<string, string[]>;
    workingGroup?: Map<string, string>;
  }

  export interface IUser {
    id: string;
    group?: Record<string, Array<string>>;
    workingGroup?: Record<string, string>;
  }

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
}
