'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Modal } from '@/components/ui/composites/Modal'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { 
  KeyIcon, 
  EyeIcon, 
  EyeOffIcon, 
  CheckCircleIcon, 
  LoaderIcon,
  AlertCircleIcon 
} from 'lucide-react'

interface PasswordSetupModalProps {
  isOpen: boolean
  onClose: () => void
  passwordSetupToken: string
  userEmail: string
  onSuccess?: () => void
}

interface PasswordValidation {
  minLength: boolean
  hasUpper: boolean
  hasLower: boolean
  hasNumber: boolean
}

export function PasswordSetupModal({ 
  isOpen, 
  onClose, 
  passwordSetupToken, 
  userEmail,
  onSuccess 
}: PasswordSetupModalProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Password validation
  const validatePassword = (pwd: string): PasswordValidation => ({
    minLength: pwd.length >= 8,
    hasUpper: /[A-Z]/.test(pwd),
    hasLower: /[a-z]/.test(pwd),
    hasNumber: /\d/.test(pwd)
  })

  const validation = validatePassword(password)
  const isPasswordValid = Object.values(validation).every(Boolean)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isPasswordValid) {
      setError('Password does not meet requirements')
      return
    }
    
    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: passwordSetupToken,
          password: password
        })
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
        
        // Give user a moment to see success message
        setTimeout(() => {
          onSuccess?.()
          router.push('/dashboard')
        }, 1500)
      } else {
        setError(data.error?.message || 'Failed to set password')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoToDashboard = () => {
    onSuccess?.()
    router.push('/dashboard')
  }

  // Success state
  if (isSuccess) {
    return (
      <Modal open={isOpen} onClose={() => {}}>
        <div className="w-full max-w-md mx-auto">
          <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Password Set Successfully!
            </h2>
            <p className="text-text-secondary mb-6">
              Your account is now ready. Redirecting to your dashboard...
            </p>
            
            <div className="flex items-center justify-center gap-2 text-brand-400">
              <LoaderIcon className="w-4 h-4 animate-spin" />
              <span className="text-sm">Redirecting...</span>
            </div>
          </CardContent>
          </Card>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="w-full max-w-md mx-auto">
        <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
              <KeyIcon className="w-5 h-5 text-brand-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary">
                Set Your Password
              </h2>
              <p className="text-sm text-text-secondary">
                Complete your account setup to access your dashboard
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Account:</strong> {userEmail}
              </p>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            {password && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">Password Requirements:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className={`flex items-center gap-2 ${validation.minLength ? 'text-green-600' : 'text-text-secondary'}`}>
                    <CheckCircleIcon className={`w-3 h-3 ${validation.minLength ? 'text-green-600' : 'text-gray-300'}`} />
                    8+ characters
                  </div>
                  <div className={`flex items-center gap-2 ${validation.hasUpper ? 'text-green-600' : 'text-text-secondary'}`}>
                    <CheckCircleIcon className={`w-3 h-3 ${validation.hasUpper ? 'text-green-600' : 'text-gray-300'}`} />
                    Uppercase letter
                  </div>
                  <div className={`flex items-center gap-2 ${validation.hasLower ? 'text-green-600' : 'text-text-secondary'}`}>
                    <CheckCircleIcon className={`w-3 h-3 ${validation.hasLower ? 'text-green-600' : 'text-gray-300'}`} />
                    Lowercase letter
                  </div>
                  <div className={`flex items-center gap-2 ${validation.hasNumber ? 'text-green-600' : 'text-text-secondary'}`}>
                    <CheckCircleIcon className={`w-3 h-3 ${validation.hasNumber ? 'text-green-600' : 'text-gray-300'}`} />
                    Number
                  </div>
                </div>
              </div>
            )}

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-600">Passwords do not match</p>
              )}
              
              {confirmPassword && passwordsMatch && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircleIcon className="w-3 h-3" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4 text-red-600" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={!isPasswordValid || !passwordsMatch || isSubmitting}
                className="flex-1"
                rightIcon={
                  isSubmitting ? 
                    <LoaderIcon className="w-4 h-4 animate-spin" /> : 
                    <KeyIcon className="w-4 h-4" />
                }
              >
                {isSubmitting ? 'Setting Password...' : 'Set Password & Continue'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={handleGoToDashboard}
                disabled={isSubmitting}
              >
                Skip for Now
              </Button>
            </div>

            <div className="text-center pt-2">
              <p className="text-xs text-text-secondary">
                By setting a password, you agree to our terms of service and privacy policy.
              </p>
            </div>
          </form>
        </CardContent>
        </Card>
      </div>
    </Modal>
  )
}