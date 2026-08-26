/* eslint-disable */
const { readFileSync } = require('fs');

const swcJestConfig = JSON.parse(
  readFileSync(`${__dirname}/.spec.swcrc`, 'utf-8'),
);

swcJestConfig.swcrc = false;

module.exports = {
  displayName: '@saas-kit/server-e2e',
  preset: '../../jest.preset.js',
  globalSetup: '<rootDir>/src/support/global-setup.ts',
  globalTeardown: '<rootDir>/src/support/global-teardown.ts',
  setupFiles: ['<rootDir>/src/support/test-setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/support/close-mail-queue.ts'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest', swcJestConfig],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: 'test-output/jest/coverage',
};
