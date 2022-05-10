// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

const endpointApi = 'http://development-upgrade-experiment-app.eba-gp6psjut.us-east-1.elasticbeanstalk.com/api';

export const environment = {
  appName: 'UpGrade',
  envName: 'DEV',
  endpointApi,
  production: false,
  test: false,
  i18nPrefix: '',
  appVersion: require('../../../../package.json').version,
  gapiClientId: '135765367152-pq4jhd3gra10jda9l6bpnmu9gqt48tup.apps.googleusercontent.com',
  domainName: '',
  api: {
    getAllExperiments: `${endpointApi}/experiments/paginated`,
    createNewExperiments: `${endpointApi}/experiments`,
    importExperiment : `${endpointApi}/experiments/import`,
    exportExperiment : `${endpointApi}/experiments/export`,
    updateExperiments: `${endpointApi}/experiments`,
    getExperimentById: `${endpointApi}/experiments/single`,
    getAllAuditLogs: `${endpointApi}/audit`,
    getAllErrorLogs: `${endpointApi}/error`,
    experimentsStats: `${endpointApi}/stats/enrollment`,
    experimentDetailStat: `${endpointApi}/stats/enrollment/detail`,
    generateCsv: `${endpointApi}/stats/csv`,
    experimentGraphInfo: `${endpointApi}/stats/enrollment/date`,
    deleteExperiment: `${endpointApi}/experiments`,
    updateExperimentState: `${endpointApi}/experiments/state`,
    users: `${endpointApi}/users`,
    loginUser: `${endpointApi}/login/user`, // Used to create a new user after login if doesn't exist in DB
    getAllUsers: `${endpointApi}/users/paginated`,
    userDetails: `${endpointApi}/users/details`,
    excludeUsers: `${endpointApi}/explicitExclude/global/user`,
    excludeGroups: `${endpointApi}/explicitExclude/global/group`,
    previewUsers: `${endpointApi}/previewUsers`,
    getAllPreviewUsers: `${endpointApi}/previewUsers/paginated`,
    previewUsersAssignCondition: `${endpointApi}/previewUsers/assign`,
    allPartitions: `${endpointApi}/experiments/partitions`,
    allExperimentNames: `${endpointApi}/experiments/names`,
    featureFlag: `${endpointApi}/flags`,
    updateFlagStatus: `${endpointApi}/flags/status`,
    getPaginatedFlags: `${endpointApi}/flags/paginated`,
    setting: `${endpointApi}/setting`,
    metrics: `${endpointApi}/metric`,
    metricsSave: `${endpointApi}/metric/save`,
    queryResult: `${endpointApi}/query/analyse`,
    getVersion: `${endpointApi}/version`,
    contextMetaData: `${endpointApi}/experiments/contextMetaData`,
    getGroupAssignmentStatus: `${endpointApi}/experiments/getGroupAssignmentStatus`,
  }
};
