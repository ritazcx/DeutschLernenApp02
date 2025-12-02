/**
 * Main Jest Configuration
 * This is the integration test configuration with spaCy service management
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // Exclude entry point
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // Global setup/teardown for spaCy service management
  // Use compiled JS files for globalSetup/globalTeardown to avoid dynamic import issues
  globalSetup: '<rootDir>/dist/tests/globalSetup.js',
  globalTeardown: '<rootDir>/dist/tests/globalTeardown.js',
  // Increase timeouts for spaCy integration tests
  testTimeout: 30000,
  // Ensure tests run serially to avoid spaCy service conflicts
  maxWorkers: 1,
};