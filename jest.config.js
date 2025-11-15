module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    '**/tests/unit/**/*.test.ts',
    '**/tests/integration/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@geometry/(.*)$': '<rootDir>/src/geometry/$1',
    '^@materials/(.*)$': '<rootDir>/src/materials/$1',
    '^@cameras/(.*)$': '<rootDir>/src/cameras/$1',
    '^@lights/(.*)$': '<rootDir>/src/lights/$1',
    '^@loaders/(.*)$': '<rootDir>/src/loaders/$1',
    '^@extras/(.*)$': '<rootDir>/src/extras/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Project configurations for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
      testEnvironment: 'node',
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
      testEnvironment: 'node',
    },
    {
      displayName: 'performance',
      displayNameColor: 'cyan',
      testMatch: ['<rootDir>/tests/performance/**/*.test.ts'],
      testEnvironment: 'node',
      testTimeout: 60000,
    },
  ],
};