import { InjectionToken } from '@angular/core';

export const ENV = new InjectionToken<Environment>('env.token');

export interface APIEndpoints {
  exportSegmentCSV: string;
  getAllExperiments: string;
  createNewExperiments: string;
  validateExperiment: string;
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
  validateSegments: string;
  importSegments: string;
  exportSegments: string;
  getGroupAssignmentStatus: string;
  stratification: string;
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
  featureFlagNavToggle: boolean;
  withinSubjectExperimentSupportToggle: boolean;
  errorLogsToggle: boolean;
}

export interface RuntimeEnvironmentConfig {
  gapiClientId?: string;
  googleClientId?: string;
  endpointApi?: string;
  apiBaseUrl?: string;
  featureFlagNavToggle?: boolean;
  withinSubjectExperimentSupportToggle?: boolean;
  errorLogsToggle?: boolean;
}
