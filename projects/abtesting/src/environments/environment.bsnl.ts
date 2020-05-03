const packageJson = require('../../../../package.json');

const endpointApi = 'http://bsnl-upgrade-experiment-app.eba-yyrtci3p.us-east-1.elasticbeanstalk.com/api';

export const environment = {
  appName: 'UpGrade',
  envName: 'bsnl',
  endpointApi,
  production: true,
  test: false,
  i18nPrefix: '',
  gapiClientId: '135765367152-pq4jhd3gra10jda9l6bpnmu9gqt48tup.apps.googleusercontent.com',
  versions: {
    app: packageJson.version,
    angular: packageJson.dependencies['@angular/core'],
    ngrx: packageJson.dependencies['@ngrx/store'],
    material: packageJson.dependencies['@angular/material'],
    bootstrap: packageJson.dependencies.bootstrap,
    rxjs: packageJson.dependencies.rxjs,
    ngxtranslate: packageJson.dependencies['@ngx-translate/core'],
    fontAwesome: packageJson.dependencies['@fortawesome/fontawesome-free-webfonts'],
    angularCli: packageJson.devDependencies['@angular/cli'],
    typescript: packageJson.devDependencies['typescript'],
    cypress: packageJson.devDependencies['cypress']
  },
  api: {
    getAllExperiments: `${endpointApi}/experiments/paginated`,
    createNewExperiments: `${endpointApi}/experiments`,
    updateExperiments: `${endpointApi}/experiments`,
    experimentContext: `${endpointApi}/experiments/context`,
    getExperimentById: `${endpointApi}/experiments/single`,
    getAllAuditLogs: `${endpointApi}/audit`,
    getAllErrorLogs: `${endpointApi}/error`,
    experimentsStats: `${endpointApi}/stats/enrolment`,
    generateCsv: `${endpointApi}/stats/csv`,
    deleteExperiment: `${endpointApi}/experiments`,
    updateExperimentState: `${endpointApi}/experiments/state`,
    users: `${endpointApi}/users`, // Used to create a new user after login
    userRole: `${endpointApi}/users/role`,
    excludeUsers: `${endpointApi}/exclude/user`,
    excludeGroups: `${endpointApi}/exclude/group`,
    previewUsers: `${endpointApi}/previewUsers`,
    previewUsersAssignCondition: `${endpointApi}/previewUsers/assign`,
    allPartitions: `${endpointApi}/experiments/partitions`,
    allExperimentNames: `${endpointApi}/experiments/names`
  }
};
