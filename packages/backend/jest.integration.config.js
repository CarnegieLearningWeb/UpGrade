const base = require('./jest.config');

module.exports = {
  ...base,
  testMatch: ['**/test/integration/**/*.test.[jt]s?(x)'],
};
