---
description: Notes on frontend config options
---

# Frontend Environment



```typescript

export const environment = {
  // name it whatever you like
  appName: 'UpGrade',
  // envName isn't currently used
  envName: 'DEV',
  // your backend service api domain
  apiBaseUrl: 'http://localhost:3030/api',
  // use production: true to quiet dev console message
  production: false,
  // this also quiets debug messages, leave as is
  test: false,
  // configure baseHref if needed by server routing
  baseHrefPrefix: '', //
  // configure hash routing if needed by server routing
  useHashRouting: false,
  // this is important! see the google client id page, must match the id in backend env
  googleClientId: ''
  // can be used to restrict domains of users logging in on client  
  domainName: '',
  // when pollingEnabled is true, an experiment details page will receive periodic updates
  pollingEnabled: false,
  // how oftern those updates are (ms)
  pollingInterval: 10 * 1000,
  // how long to poll before quitting (ms)
  pollingLimit: 600,
  // show feature flag feature in UI
  featureFlagNavToggle: true,
  // show new segments UI
  segmentsRefreshToggle: true,
  // allow within-subjects feature
  withinSubjectExperimentSupportToggle: false,
  // allow error logs feature
  errorLogsToggle: false,
  // show metrics graphs in data page
  metricAnalyticsExperimentDisplayToggle: true,
  // allow mooclet API feature integration (this is a special setup to integrate with Mooclet API server)
  moocletToggle: true,
  // api routes, leave as-is unless you know what you're doing!
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

```
