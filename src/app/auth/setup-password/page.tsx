'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { ResponsiveLogo } from '@/components/ui/primitives/Logo'
import { Container } from '@/components/layout/templates/PageLayout'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Car } from 'lucide-react'
import Link from 'next/link'

function SetupPasswordPageContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [setupToken, setSetupToken] = useState('')
  const [userEmail, setUserEmail] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const token = searchParams.get('token')
    const email = searchParams.get('email')
    
    if (!token) {
      setTokenError('Invalid or expired password setup link. Please contact support or try booking again.')
    } else {
      setSetupToken(token)
      setUserEmail(email || '')
    }
  }, [searchParams])

  const validatePassword = (pass: string) => {
    if (pass.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(pass)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(pass)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(pass)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    setError('')

    // Validate password
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    // Check password confirmation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: setupToken,
          password: password
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to set up password')
      }

      if (data.success) {
        setIsSuccess(true)
        
        // If we have a session URL, use it to sign in
        if (data.data?.sessionUrl) {
          window.location.href = data.data.sessionUrl
        } else {
          // Fallback: redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      } else {
        throw new Error(data.error?.message || 'Password setup failed')
      }
    } catch (err) {
      console.error('Password setup error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenError) {
    return (
      <Container className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <ResponsiveLogo />
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
              Invalid Setup Link
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This password setup link is invalid or has expired.
            </p>
          </div>

          <div className="rounded-md bg-destructive/10 p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-destructive">
                  Setup Link Error
                </h3>
                <div className="mt-2 text-sm text-destructive">
                  <p>{tokenError}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Need help?{' '}
              <Link href="/book" className="font-medium text-primary hover:text-primary/80">
                Try booking again
              </Link>{' '}
              or contact support.
            </p>
          </div>
        </div>
      </Container>
    )
  }

  if (isSuccess) {
    return (
      <Container className="flex items-center justify-center min-h-screen px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <ResponsiveLogo />
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mt-6">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
              Password Set Successfully! 🎉
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account is now ready. You'll be signed in automatically.
            </p>
          </div>

          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <div className="flex">
              <Car className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  Welcome to Love4Detailing!
                </h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>Your booking is confirmed and your account is ready. You can now manage your bookings and schedule future services.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Redirecting to your dashboard...
            </p>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <ResponsiveLogo />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Set Up Your Password
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Complete your account setup to access your booking dashboard
          </p>
          {userEmail && (
            <p className="mt-1 text-sm text-primary font-medium">
              {userEmail}
            </p>
          )}
        </div>

        <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex">
            <Car className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Your Booking is Confirmed! 🎉
              </h3>
              <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                <p>Set up your password to access your dashboard and manage your booking.</p>
              </div>
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 placeholder-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  placeholder="Enter your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 placeholder-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                  placeholder="Confirm your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <p className="font-medium mb-1">Password requirements:</p>
            <ul className="space-y-1">
              <li className={password.length >= 8 ? 'text-green-600' : ''}>
                • At least 8 characters long
              </li>
              <li className={/(?=.*[a-z])/.test(password) ? 'text-green-600' : ''}>
                • One lowercase letter
              </li>
              <li className={/(?=.*[A-Z])/.test(password) ? 'text-green-600' : ''}>
                • One uppercase letter
              </li>
              <li className={/(?=.*\d)/.test(password) ? 'text-green-600' : ''}>
                • One number
              </li>
            </ul>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-destructive">
                    Password Setup Error
                  </h3>
                  <div className="mt-2 text-sm text-destructive">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="group relative flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="h-4 w-4 text-primary-foreground group-hover:text-primary-foreground" />
              </span>
              {isLoading ? 'Setting up your password...' : 'Set Password & Continue'}
            </Button>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Need help?{' '}
              <Link href="/book" className="font-medium text-primary hover:text-primary/80">
                Contact support
              </Link>
            </p>
          </div>
        </form>
      </div>
    </Container>
  )
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={
      <Container className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ResponsiveLogo />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </Container>
    }>
      <SetupPasswordPageContent />
    </Suspense>
  )
}