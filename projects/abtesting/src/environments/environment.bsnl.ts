const endpointApi = 'http://new-bsnl-upgrade-experiment-app.eba-gp6psjut.us-east-1.elasticbeanstalk.com/api';

export const environment = {
  appName: 'UpGrade',
  envName: 'bsnl',
  endpointApi,
  production: true,
  test: false,
  i18nPrefix: '',
  gapiClientId: '135765367152-pq4jhd3gra10jda9l6bpnmu9gqt48tup.apps.googleusercontent.com',
  api: {
    getAllExperiments: `${endpointApi}/experiments/paginated`,
    createNewExperiments: `${endpointApi}/experiments`,
    updateExperiments: `${endpointApi}/experiments`,
    experimentContext: `${endpointApi}/experiments/context`,
    getExperimentById: `${endpointApi}/experiments/single`,
    getAllAuditLogs: `${endpointApi}/audit`,
    getAllErrorLogs: `${endpointApi}/error`,
    experimentsStats: `${endpointApi}/stats/enrolment`,
    experimentDetailStat: `${endpointApi}/stats/enrolment/detail`,
    generateCsv: `${endpointApi}/stats/csv`,
    experimentGraphInfo: `${endpointApi}/stats/enrolment/date`,
    deleteExperiment: `${endpointApi}/experiments`,
    updateExperimentState: `${endpointApi}/experiments/state`,
    users: `${endpointApi}/users`, // Used to create a new user after login
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
    queryResult: `${endpointApi}/query/analyse`
  }
};
