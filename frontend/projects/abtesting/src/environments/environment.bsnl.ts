// const endpointApi = 'https://bsnl-upgrade-experiment-app.eba-gp6psjut.us-east-1.elasticbeanstalk.com/api';
const endpointApi = 'https://upgrade-bsnl-backend.edoptimize.com/api'

export const environment = {
  appName: 'UpGrade',
  envName: 'bsnl',
  endpointApi,
  appVersion: require('../../../../package.json').version,
  production: true,
  test: false,
  i18nPrefix: '',
  gapiClientId: '135765367152-pq4jhd3gra10jda9l6bpnmu9gqt48tup.apps.googleusercontent.com',
  domainName: '',
  api: {
    getAllExperiments: `${endpointApi}/experiments/paginated`,
    createNewExperiments: `${endpointApi}/experiments`,
    importExperiment : `${endpointApi}/experiments/import`,
    updateExperiments: `${endpointApi}/experiments`,
    experimentContext: `${endpointApi}/experiments/context`,
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
    userRole: `${endpointApi}/users/role`,
    excludeUsers: `${endpointApi}/exclude/user`,
    excludeGroups: `${endpointApi}/exclude/group`,
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
  }
};
