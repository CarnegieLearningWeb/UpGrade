// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses 'environment.ts', but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

import { Environment } from './environment-types';

export const environment: Environment = {
  appName: 'UpGrade',
  envName: 'DEV',
  apiBaseUrl: 'http://localhost:3030/api',
  production: false,
  test: false,
  baseHrefPrefix: '',
  useHashRouting: false,
  googleClientId: 'replace-me-with-same-google-client-id-as-backend-env',
  domainName: '',
  segmentsRefreshToggle: false,
  withinSubjectExperimentSupportToggle: false,
  errorLogsToggle: false,
  metricAnalyticsExperimentDisplayToggle: true,
  moocletToggle: false,
};
