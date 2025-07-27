'use client'

// Temporary protected route component for clean slate phase
export function CustomerRoute({ children }: { children: React.ReactNode }) {
  // TODO: Add proper authentication check
  return <>{children}</>
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  // TODO: Add proper authentication check  
  return <>{children}</>
}