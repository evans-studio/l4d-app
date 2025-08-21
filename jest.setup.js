// Extend Jest matchers or set up test DOM helpers here
import '@testing-library/jest-dom'

/**
 * Jest Test Setup Configuration
 * 
 * Global test setup for Love4Detailing application.
 * Configures testing environment, mocks, and utilities.
 */

// Import Jest DOM matchers
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    reload: jest.fn(),
  })),
}))

// Mock Next.js navigation (App Router)
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => '/'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock Next.js Image to a plain img for tests
jest.mock('next/image', () => {
  return {
    __esModule: true,
    default: ({ src, alt = '', ...rest }) => {
      // eslint-disable-next-line jsx-a11y/alt-text
      return <img src={typeof src === 'string' ? src : (src?.src || '')} alt={alt} {...rest} />
    }
  }
})

// Mock framer-motion to avoid animation/scroll hooks in JSDOM
jest.mock('framer-motion', () => {
  const React = require('react')
  const faux = new Proxy({}, {
    get: () => (props) => React.createElement('div', props)
  })
  return {
    __esModule: true,
    m: faux,
    motion: faux,
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
    useScroll: () => ({ scrollY: { get: () => 0, on: () => () => {}, clearListeners: () => {} } }),
    useTransform: () => 0,
  }
})

// Mock environment variables for testing
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjUwMzI5MywiZXhwIjoxOTU4MDc5MjkzfQ.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQyNTAzMjkzLCJleHAiOjE5NTgwNzkyOTN9.test'
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret-32-characters-long'
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret-32-characters-long'

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
      })),
    },
  })),
}))

// Mock Supabase SSR
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
    })),
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  })),
  createBrowserClient: jest.fn(),
}))

// Mock Resend email service
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ 
        data: { id: 'test-email-id' },
        error: null 
      }),
    },
  })),
}))

// Mock fetch globally with a default successful JSON response
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true, data: [] }),
})

// Mock IntersectionObserver for JSDOM
class MockIntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
global.IntersectionObserver = MockIntersectionObserver

// Avoid overriding window.location; jsdom's implementation is non-configurable and setting it can trigger
// navigation errors in tests. If tests need to assert navigation, spy on assign/replace in the test itself.

// Mock console methods for cleaner test output
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

beforeAll(() => {
  // Suppress console.error and console.warn during tests
  console.error = jest.fn()
  console.warn = jest.fn()
})

afterAll(() => {
  // Restore console methods
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
})

// Clean up after each test
afterEach(() => {
  // Clear all mocks
  jest.clearAllMocks()
  
  // Clear fetch mock
  if (global.fetch && global.fetch.mockClear) {
    global.fetch.mockClear()
  }
})

// Global test utilities
global.testUtils = {
  // Mock user data
  mockUser: {
    id: 'test-user-id',
    email: 'test@love4detailing.com',
    email_confirmed_at: new Date().toISOString(),
    phone: '+447908625581',
    created_at: new Date().toISOString(),
  },
  
  // Mock booking data
  mockBooking: {
    id: 'test-booking-id',
    booking_reference: 'L4D-TEST-001',
    service_id: 'test-service-id',
    customer_id: 'test-customer-id',
    status: 'confirmed',
    scheduled_date: '2024-12-25',
    scheduled_time: '10:00',
    total_amount: 150.00,
    created_at: new Date().toISOString(),
  },
  
  // Mock service data
  mockService: {
    id: 'test-service-id',
    name: 'Full Valet',
    description: 'Complete car detailing service',
    duration: 180,
    base_price: 150.00,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  
  // Mock API responses
  mockApiSuccess: (data) => ({
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
    },
  }),
  
  mockApiError: (message, code = 'TEST_ERROR') => ({
    success: false,
    error: {
      message,
      code,
    },
    metadata: {
      timestamp: new Date().toISOString(),
    },
  }),
}

// Increase timeout for integration tests
jest.setTimeout(30000)