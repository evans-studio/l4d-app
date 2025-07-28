'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { ResponsiveLogo } from '@/components/ui/primitives/Logo'
import { Container } from '@/components/layout/templates/PageLayout'
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

function VerifyEmailPageContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyEmail = async () => {
      const hash = window.location.hash
      
      // Check if this is a verification link with token
      if (hash.includes('access_token') && hash.includes('type=signup')) {
        try {
          // The verification happens automatically when the user clicks the link
          // We just need to get the current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (sessionError) {
            console.error('Session error:', sessionError)
            setError('Verification failed. Please try again.')
          } else if (session?.user) {
            setIsVerified(true)
            setEmail(session.user.email || '')
            
            // Redirect to dashboard after successful verification
            setTimeout(() => {
              router.push('/dashboard?message=email-verified')
            }, 3000)
          } else {
            setError('Invalid or expired verification link.')
          }
        } catch (error) {
          console.error('Verification error:', error)
          setError('Something went wrong during verification.')
        }
      } else {
        // No verification token, show resend verification page
        const emailParam = searchParams.get('email')
        if (emailParam) {
          setEmail(emailParam)
        }
      }
      
      setIsLoading(false)
    }

    verifyEmail()
  }, [router, searchParams])

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setIsResending(true)
    setError('')

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        // Show success message
        alert('Verification email sent! Please check your inbox.')
      } else {
        setError(data.error?.message || 'Failed to send verification email')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Verifying your email...</p>
        </div>
      </div>
    )
  }

  if (isVerified) {
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
                Email Verified!
              </h2>
              <p className="mt-2 text-text-secondary">
                Your email has been successfully verified
              </p>
            </div>

            <div className="bg-surface-secondary rounded-lg p-8 border border-border-secondary shadow-lg text-center">
              <div className="space-y-4">
                <div className="bg-success-600/10 border border-success-500/20 rounded-md p-4">
                  <p className="text-success-400 text-sm">
                    <strong>Verified email:</strong> {email}
                  </p>
                </div>
                
                <div className="text-sm text-text-secondary">
                  <p>Redirecting you to your dashboard in a few seconds...</p>
                </div>
                
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => router.push('/dashboard')}
                >
                  Continue to Dashboard
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

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12">
      <Container>
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <ResponsiveLogo />
            </div>
            <div className="w-16 h-16 bg-brand-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-brand-400" />
            </div>
            <h2 className="text-3xl font-bold text-text-primary">
              Verify Your Email
            </h2>
            <p className="mt-2 text-text-secondary">
              We sent a verification link to your email address
            </p>
          </div>

          <div className="bg-surface-secondary rounded-lg p-8 border border-border-secondary shadow-lg">
            {error && (
              <div className="bg-error-600/10 border border-error-500/20 rounded-md p-4 flex items-center gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-error-400 flex-shrink-0" />
                <p className="text-error-400 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="text-center">
                {email && (
                  <div className="bg-brand-600/10 border border-brand-500/20 rounded-md p-4 mb-4">
                    <p className="text-brand-400 text-sm">
                      <strong>Email sent to:</strong> {email}
                    </p>
                  </div>
                )}
                
                <div className="text-left space-y-3 text-sm text-text-secondary">
                  <p><strong className="text-text-primary">What's next?</strong></p>
                  <ul className="space-y-2 pl-4">
                    <li className="flex items-start gap-2">
                      <span className="text-brand-400 mt-1">1.</span>
                      Check your email inbox (and spam folder)
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-400 mt-1">2.</span>
                      Click the "Verify Email" link in the email
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-brand-400 mt-1">3.</span>
                      You'll be automatically signed in
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="flex-1 px-4 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                  />
                </div>

                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleResendVerification}
                  disabled={isResending || !email.trim()}
                  leftIcon={isResending ? undefined : <RefreshCw className="w-4 h-4" />}
                >
                  {isResending ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full"></div>
                      Sending...
                    </div>
                  ) : (
                    'Resend Verification Email'
                  )}
                </Button>
              </div>

              <div className="pt-4 border-t border-border-secondary">
                <div className="bg-surface-primary p-3 rounded-md">
                  <p className="text-text-primary font-medium text-sm mb-2">Having trouble?</p>
                  <ul className="space-y-1 text-xs text-text-secondary">
                    <li>• Check your spam/junk folder</li>
                    <li>• Make sure you're using the correct email address</li>
                    <li>• The verification link will expire after 24 hours</li>
                    <li>• You can request a new verification email using the button above</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-text-secondary">
              Need help?{' '}
              <Link
                href="/auth/login"
                className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
              >
                Back to Login
              </Link>
            </p>
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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailPageContent />
    </Suspense>
  )
}