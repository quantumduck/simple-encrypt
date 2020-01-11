module.exports = {
  testRegex: '.(test|spec).(j|t)s$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['<rootDir>/src/**/*.ts', '!<rootDir>/src/index.ts'],
  testEnvironment: 'node',
  resetMocks: true,
  coverageReporters: ['json-summary', 'text'],
};
