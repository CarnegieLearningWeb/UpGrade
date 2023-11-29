import type { Config } from '@jest/types';
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
    API_VERSION: 5,
  },
  moduleNameMapper: {
    upgrade_types: '<rootDir>/../../types',
  },
  coverageReporters: ['html'],
};
export default config;
