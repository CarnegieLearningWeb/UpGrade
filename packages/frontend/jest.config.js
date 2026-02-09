module.exports = {
  preset: 'jest-preset-angular',
  rootDir: './projects/upgrade',
  roots: ['<rootDir>', '../../../types'],
  coverageDirectory: '../../coverage',
  coverageReporters: ['json-summary', 'text', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  transform: {
    '^.+\\.(ts,html)$': 'jest-preset-angular',
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/e2e/',
    '<rootDir>/src/environments/',
    // NOTE! undeveloped component specs are skipped, but they still adversely affect test runtime.
    // /features and /shared will need to be updated later
    '<rootDir>/src/app/features/',
    '<rootDir>/src/app/shared/',
  ],
};
