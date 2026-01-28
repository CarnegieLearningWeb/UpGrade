import { Environment } from './environment-types';

export const environment: Environment = {
  appName: 'UpGrade',
  envName: 'PROD',
  apiBaseUrl: 'https://upgrade-demo.carnegielearning.com/api',
  production: true,
  test: false,
  baseHrefPrefix: '/upgrade',
  useHashRouting: false,
  googleClientId: '586868075529-8k9hvk5ber8cb6qfu50945kpln7eo870.apps.googleusercontent.com',
  domainName: '',
  pollingEnabled: true,
  pollingInterval: 10 * 1000,
  pollingLimit: 600,
  segmentsRefreshToggle: true,
  withinSubjectExperimentSupportToggle: false,
  errorLogsToggle: false,
  metricAnalyticsExperimentDisplayToggle: true,
  moocletToggle: false,
};
