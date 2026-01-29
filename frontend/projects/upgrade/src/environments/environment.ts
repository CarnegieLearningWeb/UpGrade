// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses 'environment.local.ts', but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

// This file is NOT used anymore for any actual builds, so don't bother changing the values here, use 'environment.local.ts'.

export const environment = {
  appName: 'UpGrade',
  envName: 'DEV',
  apiBaseUrl: 'http://localhost:3030/api',
  production: false,
  test: false,
  baseHrefPrefix: '',
  useHashRouting: false,
  googleClientId: '',
  domainName: '',
  segmentsRefreshToggle: false,
  withinSubjectExperimentSupportToggle: false,
  errorLogsToggle: false,
  metricAnalyticsExperimentDisplayToggle: true,
  moocletToggle: true,
};
