'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { AuthLogo } from '@/components/ui/primitives/Logo'
import { Container } from '@/components/layout/templates/PageLayout'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

function ResetPasswordPageContent() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [resetToken, setResetToken] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we have the reset token from URL params (custom system)
    const token = searchParams?.get('token') || ''
    
    // Or check if we have Supabase hash parameters (fallback system)
    const hash = window.location.hash
    const hasSupabaseToken = hash.includes('access_token') && hash.includes('type=recovery')
    
    // If using Supabase recovery link, exchange the code for a session so updateUser works
    if (hasSupabaseToken) {
      void (async () => {
        try {
          await supabase.auth.exchangeCodeForSession(hash)
          // Optional: clean up the hash from the URL
          history.replaceState(null, '', window.location.pathname + window.location.search)
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error('Supabase exchangeCodeForSession failed:', e)
        }
      })()
    }

    if (!token && !hasSupabaseToken) {
      setTokenError('Invalid or expired reset link. Please request a new password reset.')
    } else if (token) {
      setResetToken(token)
    }
    // If hasSupabaseToken but no custom token, we'll use Supabase's system
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
    setIsLoading(true)
    setError('')

    // Validate passwords
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      // Check if we should use custom token system or Supabase system
      if (resetToken) {
        // Use our custom password reset API
        const response = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            token: resetToken,
            password: password 
          }),
        })

        const data = await response.json()

        if (data.success) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log('Password updated successfully via custom system')
          }
          setIsSuccess(true)
          
          // Redirect to login after a delay
          setTimeout(() => {
            router.push('/auth/login?message=password-updated')
          }, 3000)
        } else {
          if (data.error?.code === 'TOKEN_EXPIRED') {
            setError('Your reset link has expired. Please request a new password reset.')
          } else if (data.error?.code === 'INVALID_TOKEN') {
            setError('Invalid reset link. Please request a new password reset.')
          } else {
            setError(data.error?.message || 'Failed to update password. Please try again.')
          }
        }
      } else {
        // Fallback to Supabase's built-in system
        const { error: updateError } = await supabase.auth.updateUser({
          password: password
        })

        if (updateError) {
          console.error('Supabase password update error:', updateError)
          
          if (updateError.message.includes('Invalid token')) {
            setError('Your reset link has expired. Please request a new password reset.')
          } else {
            setError(updateError.message || 'Failed to update password. Please try again.')
          }
        } else {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.log('Password updated successfully via Supabase')
          }
          setIsSuccess(true)
          
          // Redirect to login after a delay
          setTimeout(() => {
            router.push('/auth/login?message=password-updated')
          }, 3000)
        }
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12">
        <Container>
          <div className="max-w-md mx-auto space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <AuthLogo />
              </div>
              <div className="w-16 h-16 bg-error-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-error-400" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary">
                Invalid Reset Link
              </h2>
              <p className="mt-2 text-text-secondary">
                {tokenError}
              </p>
            </div>

            <div className="bg-surface-secondary rounded-lg p-8 border border-border-secondary shadow-lg text-center">
              <div className="space-y-4">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => router.push('/auth/forgot-password')}
                >
                  Request New Reset Link
                </Button>
                
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => router.push('/auth/login')}
                >
                  Back to Login
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12">
        <Container>
          <div className="max-w-md mx-auto space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <AuthLogo />
              </div>
              <div className="w-16 h-16 bg-success-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-400" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary">
                Password Updated!
              </h2>
              <p className="mt-2 text-text-secondary">
                Your password has been successfully updated
              </p>
            </div>

            <div className="bg-surface-secondary rounded-lg p-8 border border-border-secondary shadow-lg text-center">
              <div className="space-y-4">
                <div className="bg-success-600/10 border border-success-500/20 rounded-md p-4">
                  <p className="text-success-400 text-sm">
                    Redirecting you to login in a few seconds...
                  </p>
                </div>
                
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => router.push('/auth/login')}
                >
                  Continue to Login
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12">
      <Container>
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <AuthLogo />
            </div>
            <h2 className="text-3xl font-bold text-text-primary">
              Set New Password
            </h2>
            <p className="mt-2 text-text-secondary">
              Enter your new password below
            </p>
          </div>

          <div className="bg-surface-secondary rounded-lg p-8 border border-border-secondary shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-error-600/10 border border-error-500/20 rounded-md p-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-error-400 flex-shrink-0" />
                  <p className="text-error-400 text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (error) setError('')
                    }}
                    className="w-full pl-12 pr-12 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                    placeholder="Enter your new password"
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (error) setError('')
                    }}
                    className="w-full pl-12 pr-12 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                    placeholder="Confirm your new password"
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-surface-primary p-4 rounded-md">
                <p className="text-text-primary font-medium text-sm mb-2">Password Requirements:</p>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li className={`flex items-center gap-2 ${password.length >= 8 ? 'text-success-400' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${password.length >= 8 ? 'bg-success-400' : 'bg-text-muted'}`}></div>
                    At least 8 characters
                  </li>
                  <li className={`flex items-center gap-2 ${/(?=.*[a-z])/.test(password) ? 'text-success-400' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${/(?=.*[a-z])/.test(password) ? 'bg-success-400' : 'bg-text-muted'}`}></div>
                    One lowercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${/(?=.*[A-Z])/.test(password) ? 'text-success-400' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${/(?=.*[A-Z])/.test(password) ? 'bg-success-400' : 'bg-text-muted'}`}></div>
                    One uppercase letter
                  </li>
                  <li className={`flex items-center gap-2 ${/(?=.*\d)/.test(password) ? 'text-success-400' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${/(?=.*\d)/.test(password) ? 'bg-success-400' : 'bg-text-muted'}`}></div>
                    One number
                  </li>
                  <li className={`flex items-center gap-2 ${password && password === confirmPassword ? 'text-success-400' : ''}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${password && password === confirmPassword ? 'bg-success-400' : 'bg-text-muted'}`}></div>
                    Passwords match
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !password.trim() || !confirmPassword.trim()}
                className="w-full"
                leftIcon={isLoading ? undefined : <Lock className="w-4 h-4" />}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Updating Password...
                  </div>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </div>

          <div className="text-center">
            <Link
              href="/auth/login"
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </Container>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordPageContent />
    </Suspense>
  )
}