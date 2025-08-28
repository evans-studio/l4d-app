/**
 * Production-Safe Logging Utility
 * 
 * Provides secure logging that automatically removes sensitive information
 * and prevents debug logs from appearing in production.
 */

// Avoid importing full environment validation on the client.
// Derive minimal flags locally so logger never triggers env validation errors.
const nodeEnv = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) || 'development'
export const isProduction = nodeEnv === 'production'
export const isDevelopment = !isProduction

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

/**
 * Sensitive fields that should be redacted from logs
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'session',
  'auth',
  'api_key',
  'access_token',
  'refresh_token',
  'service_role_key',
  'anon_key',
  'resend_api_key',
  'paypal_username',
  'email', // Redact in production only
  'phone', // Redact in production only
  'credit_card',
  'ssn',
  'social_security'
]

/**
 * Recursively redact sensitive information from objects
 */
function redactSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj === 'string') {
    // Check if the string looks like sensitive data
    const lowerStr = obj.toLowerCase()
    if (SENSITIVE_FIELDS.some(field => lowerStr.includes(field))) {
      return '[REDACTED]'
    }
    
    // Redact email addresses in production
    if (isProduction && obj.includes('@')) {
      return '[EMAIL_REDACTED]'
    }
    
    // Redact phone numbers in production
    if (isProduction && /^\+?[\d\s\-\(\)]{10,}$/.test(obj)) {
      return '[PHONE_REDACTED]'
    }
    
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item))
  }

  if (typeof obj === 'object') {
    const redacted: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const keyLower = key.toLowerCase()
      
      // Check if key name suggests sensitive data
      if (SENSITIVE_FIELDS.some(field => keyLower.includes(field))) {
        redacted[key] = '[REDACTED]'
      } else {
        redacted[key] = redactSensitiveData(value)
      }
    }
    
    return redacted
  }

  return obj
}

/**
 * Format log message with timestamp and level
 */
function formatLogMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString()
  const levelUpper = level.toUpperCase()
  
  let logMessage = `[${timestamp}] ${levelUpper}: ${message}`
  
  if (context && Object.keys(context).length > 0) {
    const safeContext = redactSensitiveData(context)
    logMessage += ` | Context: ${JSON.stringify(safeContext, null, 2)}`
  }
  
  return logMessage
}

/**
 * Production-safe logger class
 */
class Logger {
  /**
   * Debug logs - only shown in development
   */
  debug(message: string, context?: LogContext): void {
    if (isDevelopment) {
      const formattedMessage = formatLogMessage('debug', message, context)
      console.log(formattedMessage)
    }
  }

  /**
   * Info logs - shown in development and production
   */
  info(message: string, context?: LogContext): void {
    const formattedMessage = formatLogMessage('info', message, context)
    console.info(formattedMessage)
  }

  /**
   * Warning logs - always shown
   */
  warn(message: string, context?: LogContext): void {
    const formattedMessage = formatLogMessage('warn', message, context)
    console.warn(formattedMessage)
  }

  /**
   * Error logs - always shown
   */
  error(message: string, errorOrContext?: unknown, maybeContext?: LogContext): void {
    let err: Error | undefined
    let context: LogContext | undefined

    if (errorOrContext instanceof Error) {
      err = errorOrContext
      context = maybeContext
    } else if (maybeContext instanceof Error) {
      err = maybeContext
      context = typeof errorOrContext === 'object' && errorOrContext !== null
        ? (errorOrContext as LogContext)
        : errorOrContext !== undefined
          ? { data: errorOrContext }
          : undefined
    } else {
      context = typeof errorOrContext === 'object' && errorOrContext !== null
        ? (errorOrContext as LogContext)
        : errorOrContext !== undefined
          ? { data: errorOrContext }
          : undefined
    }

    const errorContext = {
      ...context,
      error: err ? {
        name: err.name,
        message: err.message,
        stack: isDevelopment ? err.stack : undefined
      } : undefined
    }

    const formattedMessage = formatLogMessage('error', message, errorContext)
    console.error(formattedMessage)
  }

  /**
   * Security-focused logging for authentication and authorization events
   */
  security(event: string, context?: LogContext): void {
    const securityContext = {
      ...context,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    }
    
    const formattedMessage = formatLogMessage('info', `SECURITY: ${event}`, securityContext)
    console.info(formattedMessage)
  }

  /**
   * Business logic logging for important application events
   */
  business(event: string, context?: LogContext): void {
    const formattedMessage = formatLogMessage('info', `BUSINESS: ${event}`, context)
    console.info(formattedMessage)
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger()

/**
 * Legacy console.log replacement for development-only logging
 * Use this to replace console.log statements throughout the codebase
 */
export const devLog = isDevelopment ? console.log : () => {}

/**
 * Production-safe console replacement
 */
export const safeConsole = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  log: isDevelopment ? console.log : () => {}
}