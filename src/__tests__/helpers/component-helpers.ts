/**
 * Component Testing Helpers
 * 
 * Utilities for testing React components with proper mocking
 * and integration test support for the Love4Detailing app.
 */

import { render, RenderOptions, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactElement } from 'react'

// Mock Next.js router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  route: '/',
  asPath: '/',
  query: {},
  isReady: true,
}

// Mock useRouter hook
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Zustand stores
export const mockBookingFlowStore = {
  availableServices: [
    {
      id: '1',
      name: 'Exterior Detail',
      description: 'Complete exterior cleaning and protection',
      basePrice: 25,
      duration: 120,
      category: 'exterior'
    },
    {
      id: '2', 
      name: 'Interior Detail',
      description: 'Thorough interior cleaning and sanitization',
      basePrice: 30,
      duration: 90,
      category: 'interior'
    }
  ],
  formData: {
    service: null,
    vehicle: null,
    timeSlot: null,
    address: null,
    userDetails: null,
    pricing: null
  },
  currentStep: 1,
  isLoading: false,
  error: null,
  setServiceSelection: jest.fn(),
  setVehicleDetails: jest.fn(),
  setTimeSlot: jest.fn(),
  setAddress: jest.fn(),
  setUserDetails: jest.fn(),
  loadAvailableServices: jest.fn(),
  loadAvailableTimeSlots: jest.fn(),
  calculatePricing: jest.fn(),
  submitBooking: jest.fn(),
  previousStep: jest.fn(),
  nextStep: jest.fn(),
  goToStep: jest.fn(),
  canProceedToNextStep: jest.fn(() => true),
  resetForm: jest.fn(),
}

export const mockAuthStore = {
  user: null,
  session: null,
  isLoading: false,
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOut: jest.fn(),
  resetPassword: jest.fn(),
  updateProfile: jest.fn(),
}

export const mockAdminStore = {
  bookings: [],
  customers: [],
  timeSlots: [],
  stats: {
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    totalCustomers: 0
  },
  isLoading: false,
  error: null,
  loadBookings: jest.fn(),
  loadCustomers: jest.fn(),
  loadTimeSlots: jest.fn(),
  updateBookingStatus: jest.fn(),
  addTimeSlot: jest.fn(),
  deleteTimeSlot: jest.fn(),
}

// Mock store hooks
jest.mock('@/lib/store/bookingFlowStore', () => ({
  useBookingFlowStore: () => mockBookingFlowStore,
  useBookingStep: (step: number) => ({
    isCurrentStep: mockBookingFlowStore.currentStep === step,
    isCompleted: mockBookingFlowStore.currentStep > step,
    canAccess: true
  })
}))

jest.mock('@/lib/store/authStore', () => ({
  useAuthStore: () => mockAuthStore
}))

jest.mock('@/lib/store/adminStore', () => ({
  useAdminStore: () => mockAdminStore
}))

// Mock API functions
export const mockApiResponse = <T>(data: T, success = true) => ({
  success,
  data: success ? data : undefined,
  error: success ? undefined : { message: 'Test error', code: 'TEST_ERROR' },
  metadata: { timestamp: new Date().toISOString() }
})

// Mock fetch calls
export const mockFetch = (response: any) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response),
    })
  ) as jest.Mock
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialProps?: Record<string, any>
}

export function renderComponent(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const user = userEvent.setup()
  
  const result = render(ui, {
    ...options,
  })

  return {
    user,
    ...result,
  }
}

// Common test utilities
export const waitForLoadingToComplete = async () => {
  await screen.findByText(/loading/i, undefined, { timeout: 3000 }).catch(() => {
    // Loading might complete quickly, that's okay
  })
}

export const expectElementToBeVisible = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
  expect(element).toBeVisible()
}

export const expectElementToHaveText = (element: HTMLElement | null, text: string) => {
  expect(element).toBeInTheDocument()
  expect(element).toHaveTextContent(text)
}

// Form testing helpers
export const fillFormField = async (user: any, labelText: string, value: string) => {
  const field = screen.getByLabelText(labelText)
  await user.clear(field)
  await user.type(field, value)
}

export const selectOption = async (user: any, labelText: string, optionText: string) => {
  const select = screen.getByLabelText(labelText)
  await user.selectOptions(select, optionText)
}

export const clickButton = async (user: any, buttonText: string) => {
  const button = screen.getByRole('button', { name: buttonText })
  await user.click(button)
}

// Component state helpers
export const resetAllMocks = () => {
  jest.clearAllMocks()
  
  // Reset store mocks to default state
  mockBookingFlowStore.currentStep = 1
  mockBookingFlowStore.formData = {
    service: null,
    vehicle: null,
    timeSlot: null,
    address: null,
    userDetails: null,
    pricing: null
  }
  mockBookingFlowStore.isLoading = false
  mockBookingFlowStore.error = null
  
  mockAuthStore.user = null
  mockAuthStore.session = null
  mockAuthStore.isLoading = false
  
  mockAdminStore.isLoading = false
  mockAdminStore.error = null
}

// Error simulation helpers
export const simulateApiError = (message = 'Test API Error') => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve(mockApiResponse(null, false)),
    })
  ) as jest.Mock
}

export const simulateNetworkError = () => {
  global.fetch = jest.fn(() => 
    Promise.reject(new Error('Network Error'))
  ) as jest.Mock
}

// Accessibility helpers
export const expectElementToBeAccessible = async (element: HTMLElement) => {
  // Check for basic accessibility attributes
  if (element.tagName === 'BUTTON') {
    expect(element).not.toHaveAttribute('aria-disabled', 'true')
  }
  
  if (element.tagName === 'INPUT') {
    const label = element.getAttribute('aria-label') || 
                  element.getAttribute('aria-labelledby') ||
                  screen.queryByLabelText(element.getAttribute('name') || '')
    expect(label).toBeTruthy()
  }
}

// Performance helpers
export const measureRenderTime = async (renderFn: () => void) => {
  const start = performance.now()
  renderFn()
  const end = performance.now()
  return end - start
}

// Type exports for test files
export type MockedFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T>
export type ComponentTestSetup = ReturnType<typeof renderComponent>