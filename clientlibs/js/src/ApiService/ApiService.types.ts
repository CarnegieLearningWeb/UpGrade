import { UpGradeClientEnums } from 'types';

export interface IApiServiceRequestParams {
  path: string;
  method: UpGradeClientEnums.REQUEST_METHOD;
  body?: any;
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
