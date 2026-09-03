import type { Config } from '@jest/types';
import packageJson = require('./package.json');
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  // A set of global variables that need to be available in all test environments
  globals: {
    'ts-jest': {
      isolatedModules: true,
      diagnostics: false,
    },
    USE_CUSTOM_HTTP_CLIENT: true,
    IS_BROWSER: true,
    API_VERSION: 6,
    CLIENT_VERSION: packageJson.version,
  },
  moduleNameMapper: {
    upgrade_types: '<rootDir>/../../packages/types/src',
  },
  coverageReporters: ['html'],
};
export default config;
