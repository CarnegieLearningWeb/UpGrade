import { UpGradeClientEnums } from 'types';

export interface IApiServiceRequestParams {
  url: string;
  requestType: UpGradeClientEnums.REQUEST_METHOD;
  requestBody?: any;
  options?: any;
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
