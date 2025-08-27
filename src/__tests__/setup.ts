/**
 * Test Setup for API Tests
 * 
 * Minimal setup file for API testing without DOM dependencies.
 */

// Import custom API validation matchers
const {
  toHaveValidApiStructure,
  toBeSuccessfulApiResponse,
  toBeFailedApiResponse,
  toHavePagination
} = require('./helpers/api-validators')

// Extend Jest matchers
expect.extend({
  toHaveValidApiStructure,
  toBeSuccessfulApiResponse,
  toBeFailedApiResponse,
  toHavePagination
})

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test'
})

afterEach(() => {
  // Clear all mocks after each test
  jest.clearAllMocks()
})