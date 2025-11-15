module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/tests/browser/**/*.test.ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.browser.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: 'coverage/browser',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
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
};
