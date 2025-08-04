'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { CustomerRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth-compat'
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Shield,
  Save,
  Eye,
  EyeOff,
  Loader
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

interface NotificationSettings {
  bookingConfirmations: boolean
  bookingReminders: boolean
  promotionalEmails: boolean
  smsNotifications: boolean
}

export default function AccountSettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'privacy'>('profile')
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
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Notification settings state
  const [notifications, setNotifications] = useState<NotificationSettings>({
    bookingConfirmations: true,
    bookingReminders: true,
    promotionalEmails: false,
    smsNotifications: false
  })

  // Load profile data and notification settings on mount
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

  // Load notification settings
  useEffect(() => {
    const loadNotificationSettings = async () => {
      try {
        const response = await fetch('/api/customer/notifications')
        const data = await response.json()
        
        if (data.success) {
          setNotifications(data.data.settings)
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error)
      }
    }

    if (user) {
      loadNotificationSettings()
    }
  }, [user])

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

  const handleNotificationUpdate = async () => {
    setIsLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/customer/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications)
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: 'Notification settings updated!' })
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to update notifications' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' })
    } finally {
      setIsLoading(false)
      clearMessage()
    }
  }

  const handleDataExport = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/customer/data-export')
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `love4detailing-data-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setMessage({ type: 'success', text: 'Data export downloaded successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to export data' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' })
    } finally {
      setIsLoading(false)
      clearMessage()
    }
  }

  const handleAccountDeletion = async () => {
    const confirmationText = prompt(
      'To delete your account, please type "DELETE MY ACCOUNT" exactly (without quotes):'
    )
    
    if (!confirmationText) return

    const reason = prompt('Please tell us why you\'re deleting your account (optional):')

    try {
      setIsLoading(true)
      const response = await fetch('/api/customer/account-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmationText,
          reason: reason || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.data.message })
        alert(data.data.details)
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Failed to process deletion request' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' })
    } finally {
      setIsLoading(false)
      clearMessage()
    }
  }

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'password' as const, label: 'Password', icon: Lock },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield }
  ]

  return (
    <CustomerRoute>
      <CustomerLayout>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Account Settings</h1>
            <p className="text-text-secondary mt-2">
              Manage your account preferences and security settings
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-border-secondary">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`min-h-[44px] py-3 px-4 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors touch-manipulation ${
                      activeTab === tab.id
                        ? 'border-brand-purple text-brand-purple'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-primary'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Profile Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileData.firstName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-4 py-3 bg-surface-primary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        required
                        value={profileData.lastName}
                        onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-4 py-3 bg-surface-primary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-surface-primary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-surface-primary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-text-primary"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="px-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'password' && (
              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Change Password</h3>
                  
                  <div className="space-y-6 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          required
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 bg-surface-primary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-text-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-surface-hover touch-manipulation"
                        >
                          {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          required
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 bg-surface-primary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-text-primary"
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-surface-hover touch-manipulation"
                        >
                          {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          required
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 bg-surface-primary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-text-primary"
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-surface-hover touch-manipulation"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="px-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium text-text-primary">Booking Confirmations</div>
                        <div className="text-sm text-text-secondary">Get notified when your bookings are confirmed</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.bookingConfirmations}
                          onChange={(e) => setNotifications(prev => ({ ...prev, bookingConfirmations: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-border-primary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-purple/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium text-text-primary">Booking Reminders</div>
                        <div className="text-sm text-text-secondary">Get reminded about upcoming appointments</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.bookingReminders}
                          onChange={(e) => setNotifications(prev => ({ ...prev, bookingReminders: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-border-primary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-purple/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium text-text-primary">Promotional Emails</div>
                        <div className="text-sm text-text-secondary">Receive special offers and promotions</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.promotionalEmails}
                          onChange={(e) => setNotifications(prev => ({ ...prev, promotionalEmails: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-border-primary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-purple/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium text-text-primary">SMS Notifications</div>
                        <div className="text-sm text-text-secondary">Receive text message notifications</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notifications.smsNotifications}
                          onChange={(e) => setNotifications(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-border-primary peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-purple/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleNotificationUpdate}
                    disabled={isLoading}
                    className="px-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Privacy & Security</h3>
                  
                  <div className="space-y-6">
                    <div className="p-4 bg-surface-primary rounded-lg border border-border-primary">
                      <h4 className="font-medium text-text-primary mb-2">Data Export</h4>
                      <p className="text-sm text-text-secondary mb-4">
                        Download a copy of all your account data including bookings, vehicles, and addresses.
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDataExport}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Preparing Export...' : 'Request Data Export'}
                      </Button>
                    </div>

                    <div className="p-4 bg-surface-primary rounded-lg border border-border-primary">
                      <h4 className="font-medium text-text-primary mb-2">Account Deletion</h4>
                      <p className="text-sm text-text-secondary mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={handleAccountDeletion}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Delete Account'}
                      </Button>
                    </div>

                    <div className="p-4 bg-surface-primary rounded-lg border border-border-primary">
                      <h4 className="font-medium text-text-primary mb-2">Privacy Policy</h4>
                      <p className="text-sm text-text-secondary mb-4">
                        Review how we collect, use, and protect your personal information.
                      </p>
                      <Button variant="outline" size="sm">
                        View Privacy Policy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CustomerLayout>
    </CustomerRoute>
  )
}