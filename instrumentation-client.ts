import * as Sentry from '@sentry/nextjs'

export const register = () => {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1
    ),
    profilesSampleRate: Number(
      process.env.NEXT_PUBLIC_SENTRY_PROFILES_SAMPLE_RATE ?? process.env.SENTRY_PROFILES_SAMPLE_RATE ?? 0.0
    ),
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart


