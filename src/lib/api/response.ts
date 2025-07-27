import { NextResponse } from 'next/server'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
  }
  metadata?: {
    pagination?: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    timestamp?: string
    version?: string
  }
}

export class ApiResponseHandler {
  static success<T>(data?: T, metadata?: ApiResponse<T>['metadata']): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    })
  }

  static error(
    message: string,
    code?: string,
    status: number = 400,
    details?: unknown
  ): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: {
        message,
        code,
        details,
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    }, { status })
  }

  static validationError(message: string, details?: unknown): NextResponse<ApiResponse> {
    return this.error(message, 'VALIDATION_ERROR', 400, details)
  }

  static unauthorized(message: string = 'Unauthorized'): NextResponse<ApiResponse> {
    return this.error(message, 'UNAUTHORIZED', 401)
  }

  static forbidden(message: string = 'Forbidden'): NextResponse<ApiResponse> {
    return this.error(message, 'FORBIDDEN', 403)
  }

  static notFound(message: string = 'Resource not found'): NextResponse<ApiResponse> {
    return this.error(message, 'NOT_FOUND', 404)
  }

  static serverError(message: string = 'Internal server error'): NextResponse<ApiResponse> {
    return this.error(message, 'INTERNAL_ERROR', 500)
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
  ): NextResponse<ApiResponse<T[]>> {
    const totalPages = Math.ceil(total / limit)
    
    return NextResponse.json({
      success: true,
      data,
      metadata: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
        timestamp: new Date().toISOString(),
      },
    })
  }
}