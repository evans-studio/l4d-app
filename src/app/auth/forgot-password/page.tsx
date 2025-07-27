'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { ResponsiveLogo } from '@/components/ui/primitives/Logo'
import { Container } from '@/components/layout/templates/PageLayout'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Use Supabase's built-in password reset instead of custom API
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        console.error('Password reset error:', error)
        setError(error.message || 'Failed to send reset email. Please try again.')
      } else {
        setIsSubmitted(true)
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12">
        <Container>
          <div className="max-w-md mx-auto space-y-8">
            {/* Header */}
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <ResponsiveLogo />
              </div>
              <div className="w-16 h-16 bg-success-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-success-400" />
              </div>
              <h2 className="text-3xl font-bold text-text-primary">
                Check Your Email
              </h2>
              <p className="mt-2 text-text-secondary">
                We've sent a password reset link to your email address
              </p>
            </div>

            {/* Success Message */}
            <div className="bg-surface-secondary rounded-lg p-8 border border-border-secondary shadow-lg text-center">
              <div className="space-y-4">
                <div className="bg-success-600/10 border border-success-500/20 rounded-md p-4">
                  <p className="text-success-400 text-sm">
                    <strong>Email sent to:</strong> {email}
                  </p>
                </div>
                
                <div className="text-left space-y-3 text-sm text-text-secondary">
                  <p><strong className="text-text-primary">What's next?</strong></p>
                  <ul className="space-y-2 pl-4">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-400 mt-1">1.</span>
                      Check your email inbox (and spam folder)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-400 mt-1">2.</span>
                      Click the "Reset Password" link in the email
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-400 mt-1">3.</span>
                      Create your new password
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-400 mt-1">4.</span>
                      Sign in with your new password
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-border-secondary">
                  <p className="text-xs text-text-muted mb-4">
                    The reset link will expire in 1 hour for security reasons.
                  </p>
                  
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        setIsSubmitted(false)
                        setEmail('')
                      }}
                    >
                      Send Another Email
                    </Button>
                    
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => window.location.href = '/auth/login'}
                    >
                      Back to Login
                    </Button>
                  </div>
                </div>
              </div>
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
              Reset Password
            </h2>
            <p className="mt-2 text-text-secondary">
              Enter your email address and we'll send you a link to reset your password
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

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (error) setError('')
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                    placeholder="Enter your email address"
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !email.trim()}
                className="w-full"
                leftIcon={isLoading ? undefined : <Mail className="w-4 h-4" />}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Sending Email...
                  </div>
                ) : (
                  'Send Reset Email'
                )}
              </Button>
            </form>

            {/* Help Text */}
            <div className="mt-6 pt-6 border-t border-border-secondary">
              <div className="space-y-3 text-sm text-text-secondary">
                <div className="bg-surface-primary p-3 rounded-md">
                  <p className="text-text-primary font-medium mb-2">Having trouble?</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Make sure you're using the email address associated with your account</li>
                    <li>• Check your spam/junk folder if you don't see the email</li>
                    <li>• The reset link will expire after 1 hour</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <p className="text-text-secondary">
              Remember your password?{' '}
              <Link
                href="/auth/login"
                className="text-brand-400 hover:text-brand-300 font-medium transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
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