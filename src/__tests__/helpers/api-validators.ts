/**
 * API Response Validation Helpers
 * 
 * Utilities for validating standardized API responses
 * following the Love4Detailing API response format.
 */

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
    validationErrors?: Record<string, string[]>
  }
  metadata?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages?: number
    }
    timestamp?: string
    [key: string]: unknown
  }
}

/**
 * Validate basic API response structure
 */
export function validateApiResponseStructure(response: unknown): response is ApiResponse {
  if (!response || typeof response !== 'object') {
    throw new Error('Response must be an object')
  }

  const res = response as Record<string, unknown>

  // success field is required and must be boolean
  if (typeof res.success !== 'boolean') {
    throw new Error('Response must have a boolean success field')
  }

  // If success is false, error field should be present
  if (res.success === false && !res.error) {
    throw new Error('Failed responses must include an error field')
  }

  // If success is true, data field should be present
  if (res.success === true && res.data === undefined) {
    throw new Error('Successful responses should include a data field')
  }

  // Validate error structure if present
  if (res.error) {
    const error = res.error as Record<string, unknown>
    if (typeof error.message !== 'string') {
      throw new Error('Error message must be a string')
    }
    if (error.code !== undefined && typeof error.code !== 'string') {
      throw new Error('Error code must be a string')
    }
  }

  // Validate metadata structure if present
  if (res.metadata) {
    const metadata = res.metadata as Record<string, unknown>
    if (metadata.pagination) {
      const pagination = metadata.pagination as Record<string, unknown>
      if (typeof pagination.page !== 'number' || 
          typeof pagination.limit !== 'number' || 
          typeof pagination.total !== 'number') {
        throw new Error('Pagination must have numeric page, limit, and total fields')
      }
    }
    if (metadata.timestamp !== undefined && typeof metadata.timestamp !== 'string') {
      throw new Error('Metadata timestamp must be a string')
    }
  }

  return true
}

/**
 * Jest matcher for API response structure
 */
export function toHaveValidApiStructure(received: unknown) {
  try {
    validateApiResponseStructure(received)
    return {
      message: () => 'Expected response to have invalid API structure',
      pass: true
    }
  } catch (error) {
    return {
      message: () => `Expected response to have valid API structure: ${error.message}`,
      pass: false
    }
  }
}

/**
 * Jest matcher for successful API responses
 */
export function toBeSuccessfulApiResponse(received: unknown, expectedData?: unknown) {
  try {
    validateApiResponseStructure(received)
    const response = received as ApiResponse

    if (!response.success) {
      return {
        message: () => `Expected successful response but got error: ${response.error?.message}`,
        pass: false
      }
    }

    if (expectedData !== undefined) {
      if (typeof expectedData === 'function') {
        // Allow custom validation function
        if (!expectedData(response.data)) {
          return {
            message: () => 'Expected data to pass custom validation',
            pass: false
          }
        }
      } else {
        // Direct comparison
        if (!deepEqual(response.data, expectedData)) {
          return {
            message: () => `Expected data to equal ${JSON.stringify(expectedData)} but got ${JSON.stringify(response.data)}`,
            pass: false
          }
        }
      }
    }

    return {
      message: () => 'Expected response to be unsuccessful',
      pass: true
    }
  } catch (error) {
    return {
      message: () => `Expected valid API response: ${error.message}`,
      pass: false
    }
  }
}

/**
 * Jest matcher for failed API responses
 */
export function toBeFailedApiResponse(received: unknown, expectedError?: { message?: string, code?: string }) {
  try {
    validateApiResponseStructure(received)
    const response = received as ApiResponse

    if (response.success) {
      return {
        message: () => 'Expected failed response but got successful response',
        pass: false
      }
    }

    if (expectedError) {
      if (expectedError.message && !response.error?.message.includes(expectedError.message)) {
        return {
          message: () => `Expected error message to contain "${expectedError.message}" but got "${response.error?.message}"`,
          pass: false
        }
      }
      if (expectedError.code && response.error?.code !== expectedError.code) {
        return {
          message: () => `Expected error code "${expectedError.code}" but got "${response.error?.code}"`,
          pass: false
        }
      }
    }

    return {
      message: () => 'Expected response to be successful',
      pass: true
    }
  } catch (error) {
    return {
      message: () => `Expected valid API response: ${error.message}`,
      pass: false
    }
  }
}

/**
 * Jest matcher for paginated API responses
 */
export function toHavePagination(received: unknown, expectedPagination?: Partial<{ page: number, limit: number, total: number }>) {
  try {
    validateApiResponseStructure(received)
    const response = received as ApiResponse

    if (!response.metadata?.pagination) {
      return {
        message: () => 'Expected response to have pagination metadata',
        pass: false
      }
    }

    const pagination = response.metadata.pagination
    
    if (expectedPagination) {
      if (expectedPagination.page !== undefined && pagination.page !== expectedPagination.page) {
        return {
          message: () => `Expected page ${expectedPagination.page} but got ${pagination.page}`,
          pass: false
        }
      }
      if (expectedPagination.limit !== undefined && pagination.limit !== expectedPagination.limit) {
        return {
          message: () => `Expected limit ${expectedPagination.limit} but got ${pagination.limit}`,
          pass: false
        }
      }
      if (expectedPagination.total !== undefined && pagination.total !== expectedPagination.total) {
        return {
          message: () => `Expected total ${expectedPagination.total} but got ${pagination.total}`,
          pass: false
        }
      }
    }

    return {
      message: () => 'Expected response to not have pagination',
      pass: true
    }
  } catch (error) {
    return {
      message: () => `Expected valid API response: ${error.message}`,
      pass: false
    }
  }
}

/**
 * Validation helpers for common data types
 */
export const validators = {
  isUser: (data: unknown): boolean => {
    if (!data || typeof data !== 'object') return false
    const user = data as Record<string, unknown>
    return (
      typeof user.id === 'string' &&
      typeof user.email === 'string' &&
      typeof user.firstName === 'string' &&
      typeof user.lastName === 'string' &&
      ['customer', 'admin', 'super_admin'].includes(user.role as string)
    )
  },

  isBooking: (data: unknown): boolean => {
    if (!data || typeof data !== 'object') return false
    const booking = data as Record<string, unknown>
    return (
      typeof booking.id === 'string' &&
      typeof booking.booking_reference === 'string' &&
      typeof booking.customer_id === 'string' &&
      typeof booking.status === 'string' &&
      typeof booking.scheduled_date === 'string' &&
      typeof booking.total_price === 'number'
    )
  },

  isBookingArray: (data: unknown): boolean => {
    return Array.isArray(data) && data.every(validators.isBooking)
  },

  isService: (data: unknown): boolean => {
    if (!data || typeof data !== 'object') return false
    const service = data as Record<string, unknown>
    return (
      typeof service.id === 'string' &&
      typeof service.name === 'string' &&
      typeof service.category === 'string' &&
      typeof service.base_price === 'number' &&
      typeof service.duration === 'number'
    )
  },

  isServiceArray: (data: unknown): boolean => {
    return Array.isArray(data) && data.every(validators.isService)
  }
}

/**
 * Helper function for deep equality comparison
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  
  if (a == null || b == null) return false
  
  if (typeof a !== typeof b) return false
  
  if (typeof a !== 'object') return false
  
  const aKeys = Object.keys(a as object)
  const bKeys = Object.keys(b as object)
  
  if (aKeys.length !== bKeys.length) return false
  
  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false
    if (!deepEqual((a as any)[key], (b as any)[key])) return false
  }
  
  return true
}

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveValidApiStructure(): R
      toBeSuccessfulApiResponse(expectedData?: unknown): R
      toBeFailedApiResponse(expectedError?: { message?: string, code?: string }): R
      toHavePagination(expectedPagination?: Partial<{ page: number, limit: number, total: number }>): R
    }
  }
}

export { ApiResponse }

// CommonJS exports for Jest compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    toHaveValidApiStructure,
    toBeSuccessfulApiResponse,
    toBeFailedApiResponse,
    toHavePagination,
    validators,
    validateApiResponseStructure
  }
}