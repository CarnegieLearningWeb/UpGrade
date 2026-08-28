module.exports = {
  preset: 'jest-preset-angular',
  rootDir: './projects/upgrade',
  roots: ['<rootDir>', '../../../types'],
  coverageDirectory: '../../coverage',
  coverageReporters: ['json-summary', 'text', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  // Fix for zone.js/testing module resolution
  moduleNameMapper: {
    '^zone.js/testing$': '<rootDir>/../../node_modules/zone.js/bundles/zone-testing.umd.js',
    // Keep other path mappings from tsconfig
    '^upgrade_types(.*)$': '<rootDir>/../../../types$1',
    '^@shared-component-lib$': '<rootDir>/src/app/shared-standalone-component-lib/components',
    '^@shared-component-lib/(.*)$': '<rootDir>/src/app/shared-standalone-component-lib/components/$1',
  },

  // Updated transform configuration
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },

  // Add transformIgnorePatterns to handle zone.js properly
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$|zone\\.js)'],

  testEnvironment: 'jsdom',

  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/e2e/',
    '<rootDir>/src/environments/',
    '<rootDir>/src/app/features/dashboard/',
    '<rootDir>/src/app/shared/',
  ],

  // Add globals for zone.js compatibility
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.spec.json',
      stringifyContentPathRegex: '\\.html$',
    },
  },
};
