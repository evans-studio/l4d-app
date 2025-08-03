interface EnvironmentConfig {
  app: {
    env: 'development' | 'staging' | 'production'
    url: string
    name: string
  }
  supabase: {
    url: string
    anonKey: string
    serviceRoleKey?: string
  }
  business: {
    name: string
    phone: string
    email: string
    serviceRadiusMiles: number
  }
  email: {
    fromEmail: string
    resendApiKey?: string
  }
}

function getRequiredEnvVar(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function getOptionalEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue
}

export const env: EnvironmentConfig = {
  app: {
    env: (getOptionalEnvVar('NEXT_PUBLIC_APP_ENV', 'development') as 'development' | 'staging' | 'production'),
    url: getOptionalEnvVar('NEXT_PUBLIC_APP_URL', 'http://localhost:3000') || 'http://localhost:3000',
    name: getOptionalEnvVar('NEXT_PUBLIC_COMPANY_NAME', 'Love4Detailing')!,
  },
  supabase: {
    url: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: getOptionalEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  },
  business: {
    name: getOptionalEnvVar('NEXT_PUBLIC_COMPANY_NAME', 'Love 4 Detailing')!,
    phone: getOptionalEnvVar('NEXT_PUBLIC_COMPANY_PHONE', '+447908625581')!,
    email: getOptionalEnvVar('NEXT_PUBLIC_COMPANY_EMAIL', 'zell@love4detailing.com')!,
    serviceRadiusMiles: parseFloat(getOptionalEnvVar('NEXT_PUBLIC_SERVICE_RADIUS_MILES', '17.5')!),
  },
  email: {
    fromEmail: getOptionalEnvVar('NEXT_PUBLIC_FROM_EMAIL', 'zell@love4detailing.com')!,
    resendApiKey: getOptionalEnvVar('RESEND_API_KEY'),
  },
}

export const isDevelopment = env.app.env === 'development'
export const isProduction = env.app.env === 'production'
export const isStaging = env.app.env === 'staging'