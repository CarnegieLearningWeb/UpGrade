import { Environment } from './environment-types';

export const environment: Environment = {
  appName: 'UpGrade',
  envName: 'PROD',
  apiBaseUrl: '%API_BASE_URL%',
  production: true,
  test: false,
  baseHrefPrefix: '%BASE_HREF_PREFIX%',
  useHashRouting: true,
  googleClientId: '%GOOGLE_CLIENT_ID%',
  domainName: '',
  withinSubjectExperimentSupportToggle: false,
  errorLogsToggle: false,
  metricAnalyticsExperimentDisplayToggle: true,
  moocletToggle: true,
};
