/**
 * API Response Sanitization and Standardization
 * 
 * Provides secure API response handling that prevents information leakage
 * and ensures consistent response formats across all endpoints.
 */

import { NextResponse } from 'next/server'
import { isProduction } from '@/lib/config/environment'
import { logger } from './logger'

/**
 * Standard API response format
 */
export interface ApiResponse<T = Record<string, unknown> | Array<Record<string, unknown>> | null> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown // Only in development
  }
  metadata?: {
    timestamp?: string
    requestId?: string
    pagination?: {
      page: number
      limit: number
      total: number
      hasMore: boolean
    }
  }
}

/**
 * Error codes for consistent error handling
 */
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  BOOKING_ERROR: 'BOOKING_ERROR'
} as const

/**
 * Sensitive fields that should be removed from API responses in production
 */
const SENSITIVE_FIELDS = [
  'password',
  'password_hash',
  'salt',
  'token',
  'secret',
  'api_key',
  'access_token',
  'refresh_token',
  'service_role_key',
  'anon_key',
  'created_by',
  'updated_by',
  'internal_id',
  'raw_user_meta_data',
  'app_metadata'
]

/**
 * Development-only fields that should be removed in production
 */
const DEVELOPMENT_FIELDS = [
  'debug_info',
  'query_info',
  'performance_metrics',
  'stack_trace'
]

/**
 * Recursively sanitize an object by removing sensitive fields
 */
function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item))
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase()
      
      // Remove sensitive fields
      if (SENSITIVE_FIELDS.some(field => keyLower.includes(field))) {
        continue // Skip this field
      }
      
      // Remove development fields in production
      if (isProduction && DEVELOPMENT_FIELDS.some(field => keyLower.includes(field))) {
        continue // Skip this field
      }
      
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value)
    }
    
    return sanitized
  }

  return obj
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T = Record<string, unknown> | Array<Record<string, unknown>> | null>(
  data?: T,
  metadata?: ApiResponse['metadata']
): ApiResponse<T> {
  const sanitizedData = sanitizeObject(data) as T
  
  return {
    success: true,
    data: sanitizedData,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata
    }
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  message: string,
  code?: keyof typeof ErrorCodes,
  details?: unknown,
  status: number = 400
): ApiResponse {
  // Sanitize error details
  const sanitizedDetails = isProduction ? undefined : sanitizeObject(details)
  
  // Log error for monitoring
  logger.error('API Error Response', undefined, {
    message,
    code,
    status,
    details: sanitizedDetails
  })
  
  return {
    success: false,
    error: {
      message,
      code,
      ...(sanitizedDetails ? { details: sanitizedDetails as Record<string, unknown> } : {})
    },
    metadata: {
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * Create a NextResponse with standardized format and security headers
 */
export function createApiResponse<T = Record<string, unknown> | Array<Record<string, unknown>> | null>(
  response: ApiResponse<T>,
  status: number = 200
): NextResponse {
  const sanitizedResponse = sanitizeObject(response) as ApiResponse
  
  const nextResponse = NextResponse.json(sanitizedResponse, { status })
  
  // Add security headers
  nextResponse.headers.set('X-Content-Type-Options', 'nosniff')
  nextResponse.headers.set('X-Frame-Options', 'DENY')
  
  // Cache control for different types of responses
  if (response.success) {
    // Successful responses can be cached briefly
    nextResponse.headers.set('Cache-Control', 'private, max-age=0, must-revalidate')
  } else {
    // Error responses should not be cached
    nextResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  }
  
  return nextResponse
}

/**
 * Wrapper for API success responses
 */
export function apiSuccess<T>(
  data?: T,
  metadata?: ApiResponse['metadata'],
  status: number = 200
): NextResponse {
  const response = createSuccessResponse(data, metadata)
  return createApiResponse(response, status)
}

/**
 * Wrapper for API error responses
 */
export function apiError(message: string,
  status: number = 400,
  code?: keyof typeof ErrorCodes,
  details?: Error | unknown): NextResponse {
  const response = createErrorResponse(message, code, details, status)
  return createApiResponse(response, status)
}

/**
 * Common error response creators
 */
export const ApiErrors = {
  unauthorized: (message = 'Unauthorized access') => 
    apiError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message = 'Access forbidden') => 
    apiError(message, 403, 'FORBIDDEN'),
  
  notFound: (message = 'Resource not found') => 
    apiError(message, 404, 'NOT_FOUND'),
  
  validation: (message = 'Validation failed', details?: unknown) => 
    apiError(message, 400, 'VALIDATION_ERROR', details),
  
  conflict: (message = 'Resource conflict') => 
    apiError(message, 409, 'CONFLICT'),
  
  internal: (message = 'Internal server error') => 
    apiError(message, 500, 'INTERNAL_ERROR'),
  
  database: (message = 'Database operation failed') => 
    apiError(message, 500, 'DATABASE_ERROR'),
  
  external: (message = 'External service error') => 
    apiError(message, 502, 'EXTERNAL_SERVICE_ERROR'),
  
  emailNotVerified: (message = 'Email verification required') => 
    apiError(message, 401, 'EMAIL_NOT_VERIFIED'),
  
  payment: (message = 'Payment processing failed') => 
    apiError(message, 402, 'PAYMENT_ERROR'),
  
  booking: (message = 'Booking operation failed') => 
    apiError(message, 400, 'BOOKING_ERROR')
}

/**
 * Pagination helper for API responses
 */
export function createPaginationMetadata(
  page: number,
  limit: number,
  total: number
): ApiResponse['metadata'] {
  return {
    pagination: {
      page,
      limit,
      total,
      hasMore: (page * limit) < total
    }
  }
}

/**
 * Validate and sanitize API request body
 */
export function sanitizeRequestBody<T>(body: unknown): T {
  // Remove potential XSS and injection attempts
  const sanitized = sanitizeObject(body) as T
  
  // Log potential security issues
  if (JSON.stringify(body) !== JSON.stringify(sanitized)) {
    logger.security('Request body sanitization applied', {
      originalKeys: Object.keys((body as Record<string, unknown>) || {}),
      sanitizedKeys: Object.keys((sanitized as unknown as Record<string, unknown>) || {})
    })
  }
  
  return sanitized
}