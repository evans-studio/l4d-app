import { NextRequest } from 'next/server'
import { z, ZodSchema } from 'zod'
import { ApiResponseHandler } from './response'

export class ApiValidation {
  static async validateBody<T>(
    body: any,
    schema: ZodSchema<T>
  ): Promise<{ success: true; data: T; error: null } | { success: false; data: null; error: Response }> {
    try {
      const result = schema.safeParse(body)
      
      if (!result.success) {
        return {
          success: false,
          data: null,
          error: ApiResponseHandler.validationError(
            'Request validation failed',
            result.error.flatten()
          )
        }
      }
      
      return { success: true, data: result.data, error: null }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: ApiResponseHandler.validationError('Invalid JSON in request body')
      }
    }
  }

  static validateQuery<T>(
    queryParams: Record<string, string>,
    schema: ZodSchema<T>
  ): { success: true; data: T; error: null } | { success: false; data: null; error: Response } {
    try {
      const result = schema.safeParse(queryParams)
      
      if (!result.success) {
        return {
          success: false,
          data: null,
          error: ApiResponseHandler.validationError(
            'Query parameter validation failed',
            result.error.flatten()
          )
        }
      }
      
      return { success: true, data: result.data, error: null }
    } catch (error) {
      return {
        success: false,
        data: null,
        error: ApiResponseHandler.validationError('Invalid query parameters')
      }
    }
  }

  static validateParams<T>(
    params: Record<string, string | string[]>,
    schema: ZodSchema<T>
  ): { data: T; error: null } | { data: null; error: Response } {
    const result = schema.safeParse(params)
    
    if (!result.success) {
      return {
        data: null,
        error: ApiResponseHandler.validationError(
          'URL parameter validation failed',
          result.error.flatten()
        )
      }
    }
    
    return { data: result.data, error: null }
  }
}