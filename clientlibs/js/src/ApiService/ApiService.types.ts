import { UpGradeClientEnums } from 'types';

export interface IApiServiceRequestParams {
  path: string;
  method: UpGradeClientEnums.REQUEST_METHOD;
  body?: any;
  // see IHttpClientWrapperRequestConfig.retryable
  retryable?: boolean;
}

export interface IEndpoints {
  init: string;
  getAllExperimentConditions: string;
  markDecisionPoint: string;
  setGroupMemberShip: string;
  setWorkingGroup: string;
  getAllFeatureFlag: string;
  log: string;
  altUserIds: string;
  reward: string;
}
