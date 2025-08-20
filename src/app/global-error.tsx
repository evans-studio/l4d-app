'use client'

import * as Sentry from '@sentry/nextjs'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  if (typeof window !== 'undefined') {
    Sentry.captureException(error)
  }

  return (
    <html>
      <body style={{ padding: 24 }}>
        <h2>Something went wrong</h2>
        <p style={{ color: '#666', marginTop: 8 }}>An unexpected error occurred. You can try again.</p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: 16,
            padding: '10px 16px',
            background: '#9747FF',
            color: '#fff',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}


