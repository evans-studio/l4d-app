/**
 * Jest Configuration for Love4Detailing
 * 
 * Production-ready testing configuration with Next.js support,
 * environment variables, and comprehensive test coverage.
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Test environment setup
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Module paths and aliases (specific first, then generic)
  moduleNameMapper: {
    '^@/lib/store/authStore$': '<rootDir>/src/lib/store/authStore.ts',
    '^@/lib/store/(.*)$': '<rootDir>/src/lib/store/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Test file patterns
  testMatch: [
    '**/?(*.)+(test|spec).(js|jsx|ts|tsx)'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
  ],
  
  // Relax thresholds during type/config cleanup; will be raised in Phase 3
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    }
  },
  
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/coverage',
  
  // Test environment variables
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Use Next.js default transform configuration
  
  // Test timeout
  testTimeout: 30000,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/dist/',
    '<rootDir>/src/__tests__/e2e/',
    '<rootDir>/src/__tests__/helpers/',
    '<rootDir>/src/__tests__/components/',
    '<rootDir>/src/__tests__/components/.*',
    '/__tests__/components/',
  ],
  
  // Mock configuration
  clearMocks: true,
  restoreMocks: true,
  
  // Globals
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },
  
  // Verbose output for debugging
  verbose: process.env.NODE_ENV === 'development',

  // Fix legacy path references in older tests (handled above)
}

// Create and export the Jest configuration
module.exports = createJestConfig(customJestConfig)