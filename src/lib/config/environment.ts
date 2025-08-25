/**
 * Environment Configuration & Validation for Love4Detailing
 * 
 * Production-ready environment validation with comprehensive checks
 * for all required configuration values and secrets.
 */

interface EnvironmentConfig {
  app: {
    env: 'development' | 'staging' | 'production'
    url: string
    name: string
  }
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey: string
  }
  auth: {
    accessTokenSecret: string
    refreshTokenSecret: string
    cookieDomain?: string
  }
  business: {
    name: string
    phone: string
    email: string
    serviceRadiusMiles: number
  }
  email: {
    fromEmail: string
    adminEmail: string
    replyTo: string
    resendApiKey: string
  }
  payment: {
    paypalUsername: string
    paypalBusinessEmail: string
  }
  monitoring?: {
    sentryDsn?: string
    googleAnalyticsId?: string
  }
}

/**
 * Environment validation errors
 */
export class EnvironmentValidationError extends Error {
  constructor(
    public missingVars: string[],
    public invalidVars: Array<{ name: string; reason: string }>
  ) {
    super(`Environment validation failed. Missing: [${missingVars.join(', ')}]. Invalid: [${invalidVars.map(v => `${v.name}: ${v.reason}`).join(', ')}]`)
    this.name = 'EnvironmentValidationError'
  }
}

/**
 * Required environment variables based on environment
 */
const REQUIRED_PRODUCTION_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET',
  'RESEND_API_KEY',
  'NEXT_PUBLIC_FROM_EMAIL',
  'ADMIN_EMAIL',
  'EMAIL_REPLY_TO',
  'PAYPAL_ME_USERNAME',
  'PAYPAL_BUSINESS_EMAIL'
] as const

const REQUIRED_DEVELOPMENT_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'ACCESS_TOKEN_SECRET',
  'REFRESH_TOKEN_SECRET'
] as const

function validateEnvironmentValue(key: string, value: string | undefined): string | null {
  if (!value || value.trim() === '') {
    return 'Value is empty or undefined'
  }

  // Specific validations
  switch (key) {
    case 'NEXT_PUBLIC_FROM_EMAIL':
    case 'ADMIN_EMAIL':
    case 'EMAIL_REPLY_TO':
    case 'PAYPAL_BUSINESS_EMAIL':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        return 'Invalid email format'
      }
      break

    case 'NEXT_PUBLIC_SUPABASE_URL':
      try {
        const url = new URL(value)
        if (!url.hostname.includes('supabase')) {
          return 'URL does not appear to be a Supabase URL'
        }
      } catch {
        return 'Invalid URL format'
      }
      break

    case 'SUPABASE_SERVICE_ROLE_KEY':
    case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
      if (!value.startsWith('eyJ')) {
        return 'Does not appear to be a valid JWT token'
      }
      break

    case 'ACCESS_TOKEN_SECRET':
    case 'REFRESH_TOKEN_SECRET':
      if (value.length < 32) {
        return 'Token secret should be at least 32 characters long'
      }
      break

    case 'PAYPAL_ME_USERNAME':
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return 'Invalid PayPal username format'
      }
      break
  }

  return null
}

function getRequiredEnvVar(key: string, isProduction = false): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  // Validate format if in production or if validation is requested
  if (isProduction) {
    const validationError = validateEnvironmentValue(key, value)
    if (validationError) {
      throw new Error(`Invalid environment variable ${key}: ${validationError}`)
    }
  }

  return value
}

function getOptionalEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue
}

/**
 * Validate environment and create configuration
 */
function createEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isProduction = nodeEnv === 'production'
  const skipValidation = process.env.ALLOW_SKIP_ENV_VALIDATION === 'true'
  
  // Determine required variables based on environment
  const requiredVars = skipValidation
    ? REQUIRED_DEVELOPMENT_VARS
    : (isProduction ? REQUIRED_PRODUCTION_VARS : REQUIRED_DEVELOPMENT_VARS)
  
  const missingVars: string[] = []
  const invalidVars: Array<{ name: string; reason: string }> = []

  // Check for missing required variables
  for (const varName of requiredVars) {
    const value = process.env[varName]
    if (!value) {
      missingVars.push(varName)
    } else if (isProduction) {
      // Only validate formats strictly in production
      const validationError = validateEnvironmentValue(varName, value)
      if (validationError) {
        invalidVars.push({ name: varName, reason: validationError })
      }
    }
  }

  // If there are validation errors, throw an error
  if (!skipValidation && (missingVars.length > 0 || invalidVars.length > 0)) {
    throw new EnvironmentValidationError(missingVars, invalidVars)
  }

  return {
    app: {
      env: nodeEnv as 'development' | 'staging' | 'production',
      url: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', isProduction ? 'https://love4detailing.com' : 'http://localhost:3000') || 'http://localhost:3000',
      name: getOptionalEnvVar('NEXT_PUBLIC_COMPANY_NAME', 'Love 4 Detailing')!,
    },
    supabase: {
      url: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL', isProduction && !skipValidation),
      anonKey: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', isProduction && !skipValidation),
      serviceRoleKey: getRequiredEnvVar('SUPABASE_SERVICE_ROLE_KEY', isProduction && !skipValidation),
    },
    auth: {
      accessTokenSecret: getRequiredEnvVar('ACCESS_TOKEN_SECRET', isProduction && !skipValidation),
      refreshTokenSecret: getRequiredEnvVar('REFRESH_TOKEN_SECRET', isProduction && !skipValidation),
      cookieDomain: getOptionalEnvVar('COOKIE_DOMAIN'),
    },
    business: {
      name: getOptionalEnvVar('NEXT_PUBLIC_COMPANY_NAME', 'Love 4 Detailing')!,
      phone: getOptionalEnvVar('NEXT_PUBLIC_COMPANY_PHONE', '+447908625581')!,
      email: getOptionalEnvVar('NEXT_PUBLIC_COMPANY_EMAIL', 'zell@love4detailing.com')!,
      serviceRadiusMiles: parseFloat(getOptionalEnvVar('NEXT_PUBLIC_SERVICE_RADIUS_MILES', '17.5')!),
    },
    email: {
      fromEmail: (isProduction && !skipValidation) ? getRequiredEnvVar('NEXT_PUBLIC_FROM_EMAIL', true) : getOptionalEnvVar('NEXT_PUBLIC_FROM_EMAIL', 'zell@love4detailing.com')!,
      adminEmail: (isProduction && !skipValidation) ? getRequiredEnvVar('ADMIN_EMAIL', true) : getOptionalEnvVar('ADMIN_EMAIL', 'zell@love4detailing.com')!,
      replyTo: (isProduction && !skipValidation) ? getRequiredEnvVar('EMAIL_REPLY_TO', true) : getOptionalEnvVar('EMAIL_REPLY_TO', 'zell@love4detailing.com')!,
      resendApiKey: (isProduction && !skipValidation) ? getRequiredEnvVar('RESEND_API_KEY', true) : getOptionalEnvVar('RESEND_API_KEY', '')!,
    },
    payment: {
      paypalUsername: (isProduction && !skipValidation) ? getRequiredEnvVar('PAYPAL_ME_USERNAME', true) : getOptionalEnvVar('PAYPAL_ME_USERNAME', 'love4detailing')!,
      paypalBusinessEmail: (isProduction && !skipValidation) ? getRequiredEnvVar('PAYPAL_BUSINESS_EMAIL', true) : getOptionalEnvVar('PAYPAL_BUSINESS_EMAIL', 'zell@love4detailing.com')!,
    },
    monitoring: {
      sentryDsn: getOptionalEnvVar('SENTRY_DSN'),
      googleAnalyticsId: getOptionalEnvVar('GOOGLE_ANALYTICS_ID'),
    },
  }
}

/**
 * Validated environment configuration
 */
export const env: EnvironmentConfig = createEnvironmentConfig()

// Helper environment checks
export const isDevelopment = env.app.env === 'development'
export const isProduction = env.app.env === 'production'
export const isStaging = env.app.env === 'staging'

/**
 * Check if all required environment variables are present for production
 */
export function isProductionReady(): { ready: boolean; issues: string[] } {
  try {
    // Check production environment variables without modifying NODE_ENV
    const productionVars = REQUIRED_PRODUCTION_VARS
    const missingVars: string[] = []
    const invalidVars: Array<{ name: string; reason: string }> = []
    
    // Check for missing required variables
    for (const varName of productionVars) {
      const value = process.env[varName]
      if (!value) {
        missingVars.push(varName)
      } else {
        // Validate the format of existing variables
        const validationError = validateEnvironmentValue(varName, value)
        if (validationError) {
          invalidVars.push({ name: varName, reason: validationError })
        }
      }
    }
    
    // Return validation results
    if (missingVars.length > 0 || invalidVars.length > 0) {
      const issues = [
        ...missingVars.map(v => `Missing: ${v}`),
        ...invalidVars.map(v => `Invalid ${v.name}: ${v.reason}`)
      ]
      return { ready: false, issues }
    }
    
    return { ready: true, issues: [] }
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      const issues = [
        ...error.missingVars.map(v => `Missing: ${v}`),
        ...error.invalidVars.map(v => `Invalid ${v.name}: ${v.reason}`)
      ]
      return { ready: false, issues }
    }
    return { ready: false, issues: ['Unknown validation error'] }
  }
}

// Validate environment on module load
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    // Environment validation happens during config creation above
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Environment validation successful')
    }
  } catch (error) {
    console.error('❌ Environment validation failed:', error)
    if (process.env.NODE_ENV === 'production') {
      // Don't use process.exit in edge runtime - just throw the error
      throw new Error(`Environment validation failed: ${error}`)
    }
  }
}