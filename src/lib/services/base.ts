import { createClient } from '@/lib/supabase/server'

export interface ServiceResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: unknown
  }
}

export abstract class BaseService {
  protected supabase = createClient()

  protected handleSuccess<T>(data?: T): ServiceResponse<T> {
    return {
      success: true,
      data,
    }
  }

  protected handleError(
    message: string,
    code?: string,
    details?: unknown
  ): ServiceResponse {
    return {
      success: false,
      error: {
        message,
        code,
        details,
      },
    }
  }

  protected async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: unknown }>,
    errorMessage: string = 'Database operation failed'
  ): Promise<ServiceResponse<T>> {
    try {
      const supabase = await this.supabase
      const { data, error } = await queryFn()

      if (error) {
        console.error('Database error:', error)
        return this.handleError(errorMessage, 'DATABASE_ERROR', error) as ServiceResponse<T>
      }

      return this.handleSuccess(data as T)
    } catch (error) {
      console.error('Service error:', error)
      return this.handleError(errorMessage, 'SERVICE_ERROR', error) as ServiceResponse<T>
    }
  }
}