import type { Config } from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
  roots: ['<rootDir>'],
  verbose: true,
  transform: {
    '^.+\\.(ts|tsx|js)$': 'ts-jest',
  },
  moduleNameMapper: {
    upgrade_types: '<rootDir>/../../types',
  },
  moduleDirectories: ['node_modules', '<rootDir>/shared'],
};

export default config;
