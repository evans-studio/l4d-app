'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-compat'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Checkbox } from '@/components/ui/primitives/Checkbox'
import { AuthLogo } from '@/components/ui/primitives/Logo'
import { Container } from '@/components/layout/templates/PageLayout'
import { Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isAdmin } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Handle success messages and errors from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const message = urlParams.get('message')
    const error = urlParams.get('error')
    
    if (message === 'password-updated') {
      setSuccessMessage('Password updated successfully! You can now sign in with your new password.')
    } else if (message === 'email-verified') {
      setSuccessMessage('Email verified successfully! You can now sign in to your account.')
    } else if (error === 'db-config') {
      setError('System configuration issue detected. Please try again in a moment.')
    }
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const urlParams = new URLSearchParams(window.location.search)
      const redirectTo = urlParams.get('redirect') || (isAdmin ? '/admin' : '/dashboard')
      router.replace(redirectTo)
    }
  }, [isAuthenticated, isAdmin, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await login(formData.email, formData.password)

      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.')
        setIsLoading(false)
        return
      }

      // Login successful - let the useEffect handle the redirect when auth state updates
      
    } catch (error: unknown) {
      console.error('Login exception:', error)
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
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

              <Input
                label="Email Address"
                type="email"
                required
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  if (error) setError('')
                  if (successMessage) setSuccessMessage('')
                }}
                placeholder="Enter your email"
                leftIcon={<Mail className="w-4 h-4" />}
                size="lg"
              />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">
                    Password
                  </span>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value })
                    if (error) setError('')
                    if (successMessage) setSuccessMessage('')
                  }}
                  placeholder="Enter your password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  size="lg"
                />
              </div>

              <Checkbox
                label="Keep me signed in for 30 days"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
              />

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
                Don&apos;t have an account?{' '}
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