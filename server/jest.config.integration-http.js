/**
 * Jest Configuration for Integration Tests (HTTP API)
 * Tests against running server on port 4000
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '<rootDir>/tests/integration/**/*.test.ts',
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
  ],
  // Increase timeouts for HTTP integration tests
  testTimeout: 10000,
  // Ensure tests run serially
  maxWorkers: 1,
  // No global setup/teardown - server should already be running
};
