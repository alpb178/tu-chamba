/** Unit tests for services and controllers (Prisma mocked, no DB). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  clearMocks: true,
  // Coverage over the app logic; scaffolding (modules, DTOs, bootstrap) with
  // no behavior of its own to test is excluded.
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/dto/**',
  ],
  coverageThreshold: {
    global: { lines: 90, statements: 90, functions: 85, branches: 72 },
  },
};
