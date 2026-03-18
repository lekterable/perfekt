module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  resetMocks: true,
  restoreMocks: true,
  moduleNameMapper: { '^~(.+)$': '<rootDir>/src/$1' },
  modulePathIgnorePatterns: ['/dist/'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/']
}
