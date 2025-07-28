'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/primitives/Button'
import { ResponsiveLogo } from '@/components/ui/primitives/Logo'
import { Container } from '@/components/layout/templates/PageLayout'
import { Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Handle success messages from URL params
  useEffect(() => {
    const message = searchParams.get('message')
    if (message === 'password-updated') {
      setSuccessMessage('Password updated successfully! You can now sign in with your new password.')
    } else if (message === 'email-verified') {
      setSuccessMessage('Email verified successfully! You can now sign in to your account.')
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      console.log('Starting login process...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        console.error('Auth error:', error)
        // Handle specific authentication errors
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please verify your email address before signing in. Check your inbox for a verification link.')
        } else if (error.message.includes('Too many requests')) {
          setError('Too many login attempts. Please wait a moment before trying again.')
        } else {
          setError(error.message)
        }
      } else if (data.user) {
        console.log('Auth successful, user ID:', data.user.id)
        
        // Check user role to redirect appropriately
        try {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', data.user.id)
            .single()

          if (profileError) {
            console.error('Profile lookup error:', profileError)
            setError('Unable to load user profile. Please try again.')
            return
          }

          console.log('Profile found:', profile)
          
          console.log('Login successful, redirecting based on role...')
          
          const redirectPath = (profile?.role === 'admin' || profile?.role === 'super_admin') ? '/admin' : '/dashboard'
          console.log('Redirecting to:', redirectPath)
          
          // Small delay to ensure session is fully established
          console.log('Waiting for session to be fully established...')
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Try router.push first to maintain session state
          console.log('Using router.push for redirect')
          router.push(redirectPath)
        } catch (profileError) {
          console.error('Profile fetch exception:', profileError)
          setError('Unable to load user profile. Please try again.')
        }
      }
    } catch (error) {
      console.error('Login exception:', error)
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center py-12">
      <Container>
        <div className="max-w-md mx-auto space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <ResponsiveLogo />
            </div>
            <h2 className="text-3xl font-bold text-text-primary">
              Sign In
            </h2>
            <p className="mt-2 text-text-secondary">
              Access your Love 4 Detailing account
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

              {successMessage && (
                <div className="bg-success-600/10 border border-success-500/20 rounded-md p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success-400 flex-shrink-0" />
                  <p className="text-success-400 text-sm">{successMessage}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      if (error) setError('')
                      if (successMessage) setSuccessMessage('')
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-text-primary">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value })
                      if (error) setError('')
                      if (successMessage) setSuccessMessage('')
                    }}
                    className="w-full pl-12 pr-12 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                    placeholder="Enter your password"
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

              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !formData.email.trim() || !formData.password.trim()}
                className="w-full"
                leftIcon={isLoading ? undefined : <Mail className="w-4 h-4" />}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-text-secondary">
                Don't have an account?{' '}
                <Link
                  href="/auth/register"
                  className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                  Create Account
                </Link>
              </p>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}