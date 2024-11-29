// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses 'environment.ts', but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  appName: 'UpGrade',
  envName: 'DEV',
  apiBaseUrl: 'http://localhost:3030/api',
  production: false,
  test: false,
  baseHrefPrefix: '',
  useHashRouting: false,
  googleClientId: '135765367152-pq4jhd3gra10jda9l6bpnmu9gqt48tup.apps.googleusercontent.com',
  domainName: '',
  pollingEnabled: true,
  pollingInterval: 10 * 1000,
  pollingLimit: 600,
  featureFlagNavToggle: true,
  withinSubjectExperimentSupportToggle: false,
  errorLogsToggle: false,
  metricAnalyticsExperimentDisplayToggle: false,
  api: {
    getAllExperiments: '/experiments/paginated',
    createNewExperiments: '/experiments',
    validateExperiment: '/experiments/validation',
    importExperiment: '/experiments/import',
    exportExperiment: '/experiments/export',
    exportAllExperiment: '/experiments/export/all',
    updateExperiments: '/experiments',
    experimentContext: '/experiments/context',
    getExperimentById: '/experiments/single',
    getAllAuditLogs: '/audit',
    getAllErrorLogs: '/error',
    experimentsStats: '/stats/enrollment',
    experimentDetailStat: '/stats/enrollment/detail',
    generateCsv: '/stats/csv',
    experimentGraphInfo: '/stats/enrollment/date',
    deleteExperiment: '/experiments',
    updateExperimentState: '/experiments/state',
    users: '/users',
    loginUser: '/login/user', // Used to create a new user after login if doesn't exist in DB
    getAllUsers: '/users/paginated',
    userDetails: '/users/details',
    previewUsers: '/previewUsers',
    stratification: '/stratification',
    getAllPreviewUsers: '/previewUsers/paginated',
    previewUsersAssignCondition: '/previewUsers/assign',
    allPartitions: '/experiments/partitions',
    allExperimentNames: '/experiments/names',
    featureFlag: '/flags',
    updateFlagStatus: '/flags/status',
    updateFilterMode: '/flags/filterMode',
    getPaginatedFlags: '/flags/paginated',
    validateFeatureFlag: '/flags/import/validation',
    validateFeatureFlagList: '/flags/lists/import/validation',
    importFeatureFlag: '/flags/import',
    importFeatureFlagList: '/flags/lists/import',
    exportFlagsDesign: '/flags/export',
    exportFFAllIncludeListsDesign: '/flags/export/includeLists',
    exportFFAllExcludeListsDesign: '/flags/export/excludeLists',
    emailFlagData: '/flags/email',
    addFlagInclusionList: '/flags/inclusionList',
    addFlagExclusionList: '/flags/exclusionList',
    setting: '/setting',
    metrics: '/metric',
    metricsSave: '/metric/save',
    queryResult: '/query/analyse',
    getVersion: '/version',
    contextMetaData: '/experiments/contextMetaData',
    segments: '/segments',
    validateSegments: '/segments/validation',
    importSegments: '/segments/import',
    exportSegments: '/segments/export/json',
    exportSegmentCSV: '/segments/export/csv',
    getGroupAssignmentStatus: '/experiments/getGroupAssignmentStatus',
  },
};
