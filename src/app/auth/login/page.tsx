'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/AuthContext'
import { Button } from '@/components/ui/primitives/Button'
import { ResponsiveLogo } from '@/components/ui/primitives/Logo'
import { Container } from '@/components/layout/templates/PageLayout'
import { Eye, EyeOff, Loader } from 'lucide-react'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const { login, profile, isAuthenticated, isLoading: authLoading } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && profile) {
      if (profile.role === 'admin' || profile.role === 'super_admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    }
  }, [authLoading, isAuthenticated, profile, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success) {
        // The useEffect will handle the redirect based on profile
        // No need to manually redirect here
      } else {
        setError(result.error || 'Login failed. Please try again.')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('') // Clear error when user starts typing
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
              Welcome Back
            </h2>
            <p className="mt-2 text-text-secondary">
              Sign in to your Love 4 Detailing account
            </p>
          </div>

          {/* Login Form */}
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
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-3 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-4 py-3 pr-12 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
                  placeholder="Enter your password"
                />
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-brand-600 border border-border-secondary rounded focus:ring-brand-400 focus:ring-2"
                />
                <span className="ml-2 text-sm text-text-secondary">
                  Remember me
                </span>
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-brand-400 hover:text-brand-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="w-full"
              leftIcon={isLoading ? <Loader className="w-4 h-4 animate-spin" /> : undefined}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-border-secondary">
            <p className="text-xs text-text-muted text-center mb-4">
              Demo Accounts (for testing):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setFormData({
                    email: 'customer@demo.com',
                    password: 'demo123'
                  })
                }}
                className="text-xs p-2 bg-surface-primary rounded text-text-secondary hover:text-text-primary hover:bg-brand-600/10 border border-border-secondary transition-colors"
              >
                👤 Customer Demo
              </button>
              <button
                onClick={() => {
                  setFormData({
                    email: 'admin@demo.com',
                    password: 'admin123'
                  })
                }}
                className="text-xs p-2 bg-surface-primary rounded text-text-secondary hover:text-text-primary hover:bg-brand-600/10 border border-border-secondary transition-colors"
              >
                🔧 Admin Demo
              </button>
            </div>
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-text-secondary">
            Don&apos;t have an account?{' '}
            <Link
              href="/auth/register"
              className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
            >
              Sign up here
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