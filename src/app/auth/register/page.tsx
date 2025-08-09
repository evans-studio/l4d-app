'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-compat'
import { Button } from '@/components/ui/primitives/Button'
import { AuthLogo } from '@/components/ui/primitives/Logo'
import { Container } from '@/components/layout/templates/PageLayout'
import { Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await register(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.phone
      )

      if (!result.success) {
        setError(result.error || 'Registration failed')
        return
      }

      // Registration always requires email verification
      if (result.success) {
        setSuccess(true)
      }

    } catch (error) {
      console.error('Registration error:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
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
                Account Created!
              </h2>
              <p className="mt-2 text-text-secondary">
                Please check your email to verify your account
              </p>
            </div>

            <div className="bg-surface-secondary rounded-lg p-8 border border-border-secondary shadow-lg text-center">
              <p className="text-text-secondary mb-6">
                We&apos;ve sent a verification link to your email address. 
                Click the link to activate your account and start booking services.
              </p>
              
              <Button
                variant="primary"
                fullWidth
                onClick={() => window.location.href = '/'}
              >
                Back to Home
              </Button>
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
              Create Account
            </h2>
            <p className="mt-2 text-text-secondary">
              Join Love 4 Detailing and book your first service
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    First Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData({ ...formData, firstName: e.target.value })
                        if (error) setError('')
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                      placeholder="First name"
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Last Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData({ ...formData, lastName: e.target.value })
                        if (error) setError('')
                      }}
                      className="w-full pl-12 pr-4 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                      placeholder="Last name"
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                  </div>
                </div>
              </div>

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
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({ ...formData, phone: e.target.value })
                      if (error) setError('')
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                    placeholder="Your phone number"
                  />
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value })
                      if (error) setError('')
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                    placeholder="Create a password"
                    minLength={8}
                  />
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                </div>
                <p className="text-text-muted text-xs mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isLoading || !formData.email.trim() || !formData.password.trim() || !formData.firstName.trim() || !formData.lastName.trim()}
                className="w-full"
                leftIcon={isLoading ? undefined : <User className="w-4 h-4" />}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-text-secondary">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                  Sign In
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