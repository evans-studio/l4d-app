'use client'

import { useAuth } from '@/lib/auth'

export default function SimpleDashboardPage() {
  const { user, profile, isLoading } = useAuth()

  console.log('SimpleDashboard render:', { user: !!user, profile: !!profile, isLoading, userEmail: user?.email })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
        <p className="ml-4 text-text-secondary">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Not Authenticated</h1>
          <p className="text-text-secondary mb-4">You need to be logged in to view this page.</p>
          <a 
            href="/auth/login"
            className="bg-brand-600 text-white px-4 py-2 rounded-md hover:bg-brand-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-primary p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-6">
          Simple Dashboard (No Route Guards)
        </h1>
        
        <div className="grid gap-6 mb-8">
          <div className="bg-surface-secondary rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">User Information</h2>
            <div className="space-y-2 text-text-secondary">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Profile Role:</strong> {profile?.role || 'Loading...'}</p>
              <p><strong>Profile Loaded:</strong> {profile ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          <div className="bg-surface-secondary rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Navigation</h2>
            <div className="space-y-3">
              <a 
                href="/dashboard" 
                className="block bg-brand-600 text-white px-4 py-2 rounded-md text-center hover:bg-brand-700"
              >
                Try Real Dashboard (with Route Guards)
              </a>
              <a 
                href="/dashboard/vehicles" 
                className="block bg-gray-600 text-white px-4 py-2 rounded-md text-center hover:bg-gray-700"
              >
                Try Vehicles Page
              </a>
              <a 
                href="/dashboard-bypass" 
                className="block bg-purple-600 text-white px-4 py-2 rounded-md text-center hover:bg-purple-700"
              >
                Try Bypass Test
              </a>
            </div>
          </div>
        </div>
        
        <div className="bg-success-600/10 border border-success-500/20 rounded-md p-4">
          <p className="text-success-400">
            ✅ If you can see this page, authentication is working perfectly! 
            The issue is with the CustomerRoute component timing.
          </p>
        </div>
      </div>
    </div>
  )
}