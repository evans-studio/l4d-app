'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { ResponsiveLogo } from '@/components/ui/primitives/Logo'
import { Container } from '@/components/layout/templates/PageLayout'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)

  const token = searchParams.get('token')

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidToken(false)
        setError('Invalid or missing reset token.')
        return
      }

      try {
        const response = await fetch('/api/auth/validate-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await response.json()
        setIsValidToken(data.success)
        
        if (!data.success) {
          setError(data.error || 'Invalid or expired reset token.')
        }
      } catch (error) {
        console.error('Token validation error:', error)
        setIsValidToken(false)
        setError('Failed to validate reset token.')
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
      } else {
        setError(data.error || 'Failed to reset password. Please try again.')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  // Loading state while validating token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12">
        <Container>
          <div className="max-w-md mx-auto text-center">
            <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-text-secondary">Validating reset link...</p>
          </div>
        </Container>
      </div>
    )
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12">
        <Container>
          <div className="max-w-md mx-auto space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <ResponsiveLogo />
              </div>
              <div className="w-16 h-16 bg-error-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-error-400" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary">
                Invalid Reset Link
              </h2>
              <p className="mt-2 text-text-secondary">
                This password reset link is invalid or has expired
              </p>
            </div>

            <div className="bg-surface-secondary rounded-lg p-8 border border-border-secondary shadow-lg text-center">
              <div className="bg-error-600/10 border border-error-500/20 rounded-md p-4 mb-6">
                <p className="text-error-400 text-sm">{error}</p>
              </div>
              
              <p className="text-text-secondary text-sm mb-6">
                Password reset links expire after 1 hour for security reasons. 
                You'll need to request a new reset link.
              </p>

              <div className="space-y-3">
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

            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12">
        <Container>
          <div className="max-w-md mx-auto space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <ResponsiveLogo />
              </div>
              <div className="w-16 h-16 bg-success-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-400" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary">
                Password Reset Successful
              </h2>
              <p className="mt-2 text-text-secondary">
                Your password has been successfully updated
              </p>
            </div>

            <div className="bg-surface-secondary rounded-lg p-8 border border-border-secondary shadow-lg text-center">
              <div className="bg-success-600/10 border border-success-500/20 rounded-md p-4 mb-6">
                <p className="text-success-400 text-sm">
                  You can now sign in with your new password
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

            <div className="text-center">
              <Link
                href="/"
                className="text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </Container>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12">
      <Container>
        <div className="max-w-md mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <ResponsiveLogo />
            </div>
            <h2 className="text-3xl font-bold text-text-primary">
              Set New Password
            </h2>
            <p className="mt-2 text-text-secondary">
              Enter your new password below
            </p>
          </div>

          {/* Reset Form */}
          <div className="bg-surface-secondary rounded-lg p-8 border border-border-secondary shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-error-600/10 border border-error-500/20 rounded-md p-4">
                  <p className="text-error-400 text-sm">{error}</p>
                </div>
              )}

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                    placeholder="Enter new password"
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                    placeholder="Confirm new password"
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-surface-primary p-3 rounded-md">
                <p className="text-text-primary text-sm font-medium mb-2">Password requirements:</p>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-success-400' : ''}`}>
                    <div className={`w-1 h-1 rounded-full ${formData.password.length >= 8 ? 'bg-success-400' : 'bg-text-muted'}`}></div>
                    At least 8 characters long
                  </li>
                  <li className={`flex items-center gap-2 ${formData.password && formData.confirmPassword && formData.password === formData.confirmPassword ? 'text-success-400' : ''}`}>
                    <div className={`w-1 h-1 rounded-full ${formData.password && formData.confirmPassword && formData.password === formData.confirmPassword ? 'bg-success-400' : 'bg-text-muted'}`}></div>
                    Passwords match
                  </li>
                </ul>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !formData.password || !formData.confirmPassword}
                className="w-full"
                leftIcon={<Lock className="w-4 h-4" />}
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

          {/* Back to Login */}
          <div className="text-center">
            <p className="text-text-secondary">
              Remember your password?{' '}
              <Link
                href="/auth/login"
                className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
              >
                Back to Login
              </Link>
            </p>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-text-muted hover:text-text-secondary transition-colors"
            >
              ← Back to Home
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
      <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12">
        <Container>
          <div className="max-w-md mx-auto text-center">
            <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading...</p>
          </div>
        </Container>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}