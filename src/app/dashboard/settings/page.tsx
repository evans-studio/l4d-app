'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { Input } from '@/components/ui/primitives/Input'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { CustomerRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth-compat'
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Shield,
  Save,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
}

interface PasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export default function AccountSettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [activeSection, setActiveSection] = useState<'profile' | 'password' | 'privacy'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Profile form state
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  // Password form state
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState(false)

  // Load profile data on mount
  useEffect(() => {
    if (profile) {
      setProfileData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        email: profile.email || '',
        phone: profile.phone || ''
      })
    }
  }, [profile])

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 5000)
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/customer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        await refreshProfile()
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' })
    } finally {
      setIsLoading(false)
      clearMessage()
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      setIsLoading(false)
      clearMessage()
      return
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters long' })
      setIsLoading(false)
      clearMessage()
      return
    }

    try {
      const response = await fetch('/api/customer/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' })
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to update password' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' })
    } finally {
      setIsLoading(false)
      clearMessage()
    }
  }

  // Password validation function
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long'
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter'
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter'
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number'
    }
    return null
  }

  const sections = [
    { id: 'profile' as const, label: 'Profile', icon: User, description: 'Update your personal information' },
    { id: 'password' as const, label: 'Password', icon: Lock, description: 'Change your account password' },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield, description: 'Privacy policies and account data' }
  ]

  return (
    <CustomerRoute>
      <CustomerLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-text-primary">Account Settings</h1>
            <p className="text-text-secondary">
              Manage your personal information and account security
            </p>
          </div>

          {/* Status Message */}
          {message && (
            <Card className={`border ${
              message.type === 'success' 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {message.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                    {message.text}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mobile-First Section Navigation */}
          <div className="space-y-6">
            {/* Mobile: Dropdown, Desktop: Tabs */}
            <div className="sm:hidden">
              <select
                value={activeSection}
                onChange={(e) => setActiveSection(e.target.value as typeof activeSection)}
                className="w-full min-h-[48px] px-4 py-3 bg-surface-secondary border border-border-secondary rounded-lg text-text-primary focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 touch-manipulation"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Desktop: Tab Navigation */}
            <div className="hidden sm:block border-b border-border-secondary">
              <nav className="flex space-x-8">
                {sections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`min-h-[44px] py-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors touch-manipulation ${
                        activeSection === section.id
                          ? 'border-brand-600 text-brand-600'
                          : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-primary'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{section.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Section Content */}
          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-brand-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Profile Information</h3>
                    <p className="text-sm text-text-secondary">Update your personal details</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          First Name *
                        </label>
                        <Input
                          type="text"
                          required
                          value={profileData.firstName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                          placeholder="Enter your first name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Last Name *
                        </label>
                        <Input
                          type="text"
                          required
                          value={profileData.lastName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Email Address *
                      </label>
                      <Input
                        type="email"
                        required
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="your.email@example.com"
                        leftIcon={<Mail className="w-4 h-4" />}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="07123 456789 (optional)"
                        leftIcon={<Phone className="w-4 h-4" />}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      loading={isLoading}
                      leftIcon={isLoading ? <Loader2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      className="min-w-[140px]"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            )}

          {activeSection === 'password' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5 text-brand-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Change Password</h3>
                    <p className="text-sm text-text-secondary">Update your account password</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Current Password *
                      </label>
                      <div className="relative">
                        <Input
                          type={showPasswords ? 'text' : 'password'}
                          required
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          placeholder="Enter your current password"
                          className="pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                          aria-label={showPasswords ? 'Hide password' : 'Show password'}
                        >
                          {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <Input
                          type={showPasswords ? 'text' : 'password'}
                          required
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter your new password"
                          minLength={8}
                          className="pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                          aria-label={showPasswords ? 'Hide password' : 'Show password'}
                        >
                          {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <Input
                          type={showPasswords ? 'text' : 'password'}
                          required
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm your new password"
                          minLength={8}
                          className="pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                          aria-label={showPasswords ? 'Hide password' : 'Show password'}
                        >
                          {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Password Requirements */}
                    {passwordData.newPassword && (
                      <div className="p-4 bg-surface-tertiary rounded-lg border border-border-secondary">
                        <p className="text-sm font-medium text-text-primary mb-3">Password requirements:</p>
                        <ul className="space-y-1 text-xs">
                          <li className={`flex items-center gap-2 ${
                            passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-text-muted'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              passwordData.newPassword.length >= 8 ? 'bg-green-600' : 'bg-border-secondary'
                            }`} />
                            At least 8 characters long
                          </li>
                          <li className={`flex items-center gap-2 ${
                            /(?=.*[a-z])/.test(passwordData.newPassword) ? 'text-green-600' : 'text-text-muted'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              /(?=.*[a-z])/.test(passwordData.newPassword) ? 'bg-green-600' : 'bg-border-secondary'
                            }`} />
                            One lowercase letter
                          </li>
                          <li className={`flex items-center gap-2 ${
                            /(?=.*[A-Z])/.test(passwordData.newPassword) ? 'text-green-600' : 'text-text-muted'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              /(?=.*[A-Z])/.test(passwordData.newPassword) ? 'bg-green-600' : 'bg-border-secondary'
                            }`} />
                            One uppercase letter
                          </li>
                          <li className={`flex items-center gap-2 ${
                            /(?=.*\d)/.test(passwordData.newPassword) ? 'text-green-600' : 'text-text-muted'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              /(?=.*\d)/.test(passwordData.newPassword) ? 'bg-green-600' : 'bg-border-secondary'
                            }`} />
                            One number
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      loading={isLoading}
                      leftIcon={isLoading ? <Loader2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      className="min-w-[160px]"
                    >
                      {isLoading ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            )}

          {activeSection === 'privacy' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-brand-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">Privacy & Policies</h3>
                    <p className="text-sm text-text-secondary">Manage your privacy and view policies</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="p-6 bg-surface-tertiary rounded-lg border border-border-secondary">
                    <h4 className="font-medium text-text-primary mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Privacy Policy
                    </h4>
                    <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                      Review how Love4Detailing collects, uses, and protects your personal information.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('/privacy-policy', '_blank')}
                      className="min-h-[44px]"
                    >
                      View Privacy Policy
                    </Button>
                  </div>

                  <div className="p-6 bg-surface-tertiary rounded-lg border border-border-secondary">
                    <h4 className="font-medium text-text-primary mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Terms of Service
                    </h4>
                    <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                      Read our terms and conditions for using Love4Detailing services.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open('/terms', '_blank')}
                      className="min-h-[44px]"
                    >
                      View Terms of Service
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CustomerLayout>
    </CustomerRoute>
  )
}