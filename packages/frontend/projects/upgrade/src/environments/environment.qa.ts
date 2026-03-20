import { Environment } from './environment-types';

export const environment: Environment = {
  appName: 'UpGrade',
  envName: 'qa',
  apiBaseUrl: '%API_BASE_URL%',
  production: true,
  test: false,
  baseHrefPrefix: '%BASE_HREF_PREFIX%',
  useHashRouting: true,
  googleClientId: '%GOOGLE_CLIENT_ID%',
  domainName: '',
  withinSubjectExperimentSupportToggle: true,
  errorLogsToggle: false,
  metricAnalyticsExperimentDisplayToggle: true,
  moocletToggle: true,
};
