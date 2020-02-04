// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

const packageJson = require('../../../../package.json');

const endpointApi =
  'http://upgrade-development.us-east-1.elasticbeanstalk.com/api';

export const environment = {
  appName: 'EES Client',
  envName: 'DEV',
  production: false,
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
    fontAwesome: packageJson.dependencies['@fortawesome/fontawesome-free'],
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
