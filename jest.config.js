export default {
  // Test environment
  testEnvironment: 'node',
  
  // Module support - ES modules handled by Node.js
  transform: {},
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js',
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],
  
  // Coverage configuration
  collectCoverage: false, // Enable with --coverage flag
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    'server.js',
    '!src/**/*.test.js',
    '!src/**/*.spec.js',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/dist/**',
  ],
  
  // Coverage thresholds (for clean architecture quality)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 90,
      statements: 90,
    },
  },
  
  // Setup files
  setupFilesAfterEnv: [],
  
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
};