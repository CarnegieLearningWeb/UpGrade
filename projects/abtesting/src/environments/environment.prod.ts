const packageJson = require('../../../../package.json');

const endpointApi =
  'http://upgrade-production.us-east-1.elasticbeanstalk.com/api';

export const environment = {
  appName: 'EES Client',
  envName: 'PROD',
  production: true,
  test: false,
  i18nPrefix: '',
  gapiClientId: '347071716460-budh5le9mkf03ahp89hs8n096phq8dv3.apps.googleusercontent.com',
  versions: {
    app: packageJson.version,
    angular: packageJson.dependencies['@angular/core'],
    ngrx: packageJson.dependencies['@ngrx/store'],
    material: packageJson.dependencies['@angular/material'],
    bootstrap: packageJson.dependencies.bootstrap,
    rxjs: packageJson.dependencies.rxjs,
    ngxtranslate: packageJson.dependencies['@ngx-translate/core'],
    fontAwesome:
      packageJson.dependencies['@fortawesome/fontawesome-free-webfonts'],
    angularCli: packageJson.devDependencies['@angular/cli'],
    typescript: packageJson.devDependencies['typescript'],
    cypress: packageJson.devDependencies['cypress']
  },
  api: {
    getAllExperiments: `${endpointApi}/experiments`,
    createNewExperiments: `${endpointApi}/experiments`,
    updateExperiments: `${endpointApi}/experiments`,
    getAllAudits: `${endpointApi}/audit`,
    experimentsStats: `${endpointApi}/stats`,
    deleteExperiment: `${endpointApi}/experiments`
  }
};
