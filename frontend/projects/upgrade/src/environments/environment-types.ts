import { InjectionToken } from '@angular/core';

export const ENV = new InjectionToken<Environment>('env.token');

export interface APIEndpoints {
  getAllExperiments: string;
  createNewExperiments: string;
  importExperiment: string;
  exportExperiment: string;
  updateExperiments: string;
  getExperimentById: string;
  getAllAuditLogs: string;
  getAllErrorLogs: string;
  experimentsStats: string;
  experimentDetailStat: string;
  generateCsv: string;
  experimentGraphInfo: string;
  deleteExperiment: string;
  updateExperimentState: string;
  users: string;
  loginUser: string;
  getAllUsers: string;
  userDetails: string;
  previewUsers: string;
  getAllPreviewUsers: string;
  previewUsersAssignCondition: string;
  allPartitions: string;
  allExperimentNames: string;
  featureFlag: string;
  updateFlagStatus: string;
  getPaginatedFlags: string;
  setting: string;
  metrics: string;
  metricsSave: string;
  queryResult: string;
  getVersion: string;
  contextMetaData: string;
  segments: string;
  importSegments: string;
  exportSegment: string;
  exportSegments: string;
  getGroupAssignmentStatus: string;
}

export interface Environment {
  appName: string;
  envName: string;
  apiBaseUrl: string;
  production: boolean;
  test: boolean;
  baseHrefPrefix: string;
  googleClientId: string;
  domainName: string;
  pollingEnabled: boolean;
  pollingInterval: number;
  pollingLimit: number;
  api: APIEndpoints;
}

export interface RuntimeEnvironmentConfig {
  gapiClientId?: string;
  googleClientId?: string;
  endpointApi?: string;
  apiBaseUrl?: string;
}
