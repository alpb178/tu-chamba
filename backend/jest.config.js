/** Tests unitarios de servicios y controladores (Prisma mockeado, sin BD). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testRegex: '.*\\.spec\\.ts$',
  moduleFileExtensions: ['js', 'json', 'ts'],
  clearMocks: true,
  // Cobertura sobre la lógica de la app; se excluye el andamiaje (módulos,
  // DTOs, bootstrap) que no tiene comportamiento propio que testear.
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
