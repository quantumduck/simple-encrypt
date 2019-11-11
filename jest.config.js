module.exports = {
  testRegex: '.test.ts$|.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['<rootDir>/src/*/**/*.ts', '!<rootDir>/src/index.ts'],
  testEnvironment: 'node',
  resetMocks: true,
  coverageReporters: ['json-summary'],
};
