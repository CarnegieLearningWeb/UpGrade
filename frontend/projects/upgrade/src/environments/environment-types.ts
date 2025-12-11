import { InjectionToken } from '@angular/core';

export const ENV = new InjectionToken<Environment>('env.token');

export interface Environment {
  appName: string;
  envName: string;
  apiBaseUrl: string;
  production: boolean;
  test: boolean;
  baseHrefPrefix: string;
  useHashRouting: boolean;
  googleClientId: string;
  domainName: string;
  pollingEnabled: boolean;
  pollingInterval: number;
  pollingLimit: number;
  segmentsRefreshToggle: boolean;
  errorLogsToggle: boolean;
  withinSubjectExperimentSupportToggle: boolean;
  metricAnalyticsExperimentDisplayToggle: boolean;
  moocletToggle: boolean;
}

export interface RuntimeEnvironmentConfig {
  gapiClientId?: string;
  googleClientId?: string;
  endpointApi?: string;
  apiBaseUrl?: string;
  segmentsRefreshToggle?: boolean;
  withinSubjectExperimentSupportToggle?: boolean;
  errorLogsToggle?: boolean;
  metricAnalyticsExperimentDisplayToggle?: boolean;
}
