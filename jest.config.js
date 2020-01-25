module.exports = {
  testRegex: '.(test|spec).(j|t)s$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/run.ts'],
  testEnvironment: 'node',
  resetMocks: true,
  coverageReporters: ['json-summary', 'text'],
};
