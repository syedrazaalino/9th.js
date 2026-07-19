module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/unit/**/*.test.cjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {}
};
