export const environment = {
  appName: 'UpGrade',
  envName: 'PROD',
  apiBaseUrl: '',
  production: true,
  test: false,
  baseHrefPrefix: '',
  useHashRouting: false,
  googleClientId: '',
  domainName: '',
  pollingEnabled: true,
  pollingInterval: 10 * 1000,
  pollingLimit: 600,
  featureFlagNavToggle: false,
  withinSubjectExperimentSupportToggle: false,
  errorLogsToggle: false,
  metricAnalyticsExperimentDisplayToggle: false,
  moocletToggle: false,
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
    emailFlagData: '/flags/mail',
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
    exportSegment: '/segments/export',
    exportSegmentCSV: '/segments/export/csv',
    getGroupAssignmentStatus: '/experiments/getGroupAssignmentStatus',
  },
};
