'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { Button } from '@/components/ui/primitives/Button'
import { 
  SettingsIcon, 
  SaveIcon, 
  MapPinIcon, 
  ClockIcon, 
  DollarSignIcon,
  MailIcon,
  PhoneIcon,
  BellIcon,
  ShieldIcon,
  DatabaseIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  LoaderIcon
} from 'lucide-react'

interface BusinessSettings {
  businessName: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  operatingHours: {
    monday: { open: string; close: string; isOpen: boolean }
    tuesday: { open: string; close: string; isOpen: boolean }
    wednesday: { open: string; close: string; isOpen: boolean }
    thursday: { open: string; close: string; isOpen: boolean }
    friday: { open: string; close: string; isOpen: boolean }
    saturday: { open: string; close: string; isOpen: boolean }
    sunday: { open: string; close: string; isOpen: boolean }
  }
  serviceRadius: number
  minimumBookingNotice: number
  maximumBookingAdvance: number
  defaultServiceDuration: number
  cancellationPolicy: string
  emailNotifications: {
    newBookings: boolean
    bookingConfirmations: boolean
    bookingReminders: boolean
    customerRegistrations: boolean
  }
  smsNotifications: {
    bookingReminders: boolean
    statusUpdates: boolean
  }
}

function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: 'Love 4 Detailing',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    operatingHours: {
      monday: { open: '09:00', close: '17:00', isOpen: true },
      tuesday: { open: '09:00', close: '17:00', isOpen: true },
      wednesday: { open: '09:00', close: '17:00', isOpen: true },
      thursday: { open: '09:00', close: '17:00', isOpen: true },
      friday: { open: '09:00', close: '17:00', isOpen: true },
      saturday: { open: '09:00', close: '15:00', isOpen: true },
      sunday: { open: '10:00', close: '14:00', isOpen: false }
    },
    serviceRadius: 25,
    minimumBookingNotice: 24,
    maximumBookingAdvance: 90,
    defaultServiceDuration: 120,
    cancellationPolicy: '24 hours notice required for cancellations. Full refund available within policy.',
    emailNotifications: {
      newBookings: true,
      bookingConfirmations: true,
      bookingReminders: true,
      customerRegistrations: true
    },
    smsNotifications: {
      bookingReminders: false,
      statusUpdates: false
    }
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('business')

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/settings')
      const data = await response.json()

      if (data.success) {
        setSettings({ ...settings, ...data.data })
      }
    } catch (error) {
      console.error('Settings load error:', error)
      setError('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }, [settings])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Settings saved successfully')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error?.message || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Settings save error:', error)
      setError('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const updateOperatingHours = (day: string, field: string, value: string | boolean) => {
    setSettings({
      ...settings,
      operatingHours: {
        ...settings.operatingHours,
        [day]: {
          ...settings.operatingHours[day as keyof typeof settings.operatingHours],
          [field]: value
        }
      }
    })
  }

  const updateEmailNotification = (key: string, value: boolean) => {
    setSettings({
      ...settings,
      emailNotifications: {
        ...settings.emailNotifications,
        [key]: value
      }
    })
  }

  const updateSmsNotification = (key: string, value: boolean) => {
    setSettings({
      ...settings,
      smsNotifications: {
        ...settings.smsNotifications,
        [key]: value
      }
    })
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingPassword(true)
    setPasswordError('')
    setPasswordSuccess('')

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      setIsUpdatingPassword(false)
      return
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long')
      setIsUpdatingPassword(false)
      return
    }

    try {
      const response = await fetch('/api/admin/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (data.success) {
        setPasswordSuccess('Password updated successfully!')
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => setPasswordSuccess(''), 5000)
      } else {
        setPasswordError(data.error?.message || 'Failed to update password')
      }
    } catch (error) {
      setPasswordError('Network error occurred')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const tabs = [
    { id: 'business', label: 'Business Info', icon: SettingsIcon },
    { id: 'hours', label: 'Operating Hours', icon: ClockIcon },
    { id: 'booking', label: 'Booking Rules', icon: MapPinIcon },
    { id: 'notifications', label: 'Notifications', icon: BellIcon },
    { id: 'password', label: 'Password', icon: LockIcon },
    { id: 'system', label: 'System', icon: DatabaseIcon }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
            <p className="text-text-secondary">Configure your business settings and preferences</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            leftIcon={isSaving ? undefined : <SaveIcon className="w-4 h-4" />}
          >
            {isSaving ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border-secondary">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-brand-purple text-brand-purple'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-text-primary">Business Information</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={settings.businessName}
                      onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                      className="w-full px-3 py-2 border border-border-secondary rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Business Phone
                    </label>
                    <input
                      type="tel"
                      value={settings.businessPhone}
                      onChange={(e) => setSettings({ ...settings, businessPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-border-secondary rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Business Address
                    </label>
                    <textarea
                      value={settings.businessAddress}
                      onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-border-secondary rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Business Email
                    </label>
                    <input
                      type="email"
                      value={settings.businessEmail}
                      onChange={(e) => setSettings({ ...settings, businessEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-border-secondary rounded-md"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Operating Hours Tab */}
          {activeTab === 'hours' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-text-primary">Operating Hours</h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(settings.operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center space-x-4 p-4 border border-border-secondary rounded-lg">
                      <div className="w-24">
                        <span className="font-medium text-text-primary capitalize">{day}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={hours.isOpen}
                          onChange={(e) => updateOperatingHours(day, 'isOpen', e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-text-secondary">Open</span>
                      </div>
                      {hours.isOpen && (
                        <>
                          <input
                            type="time"
                            value={hours.open}
                            onChange={(e) => updateOperatingHours(day, 'open', e.target.value)}
                            className="px-3 py-2 border border-border-secondary rounded-md"
                          />
                          <span className="text-text-secondary">to</span>
                          <input
                            type="time"
                            value={hours.close}
                            onChange={(e) => updateOperatingHours(day, 'close', e.target.value)}
                            className="px-3 py-2 border border-border-secondary rounded-md"
                          />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking Rules Tab */}
          {activeTab === 'booking' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-text-primary">Booking Rules</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Service Radius (miles)
                    </label>
                    <input
                      type="number"
                      value={settings.serviceRadius}
                      onChange={(e) => setSettings({ ...settings, serviceRadius: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-border-secondary rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Minimum Booking Notice (hours)
                    </label>
                    <input
                      type="number"
                      value={settings.minimumBookingNotice}
                      onChange={(e) => setSettings({ ...settings, minimumBookingNotice: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-border-secondary rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Maximum Booking Advance (days)
                    </label>
                    <input
                      type="number"
                      value={settings.maximumBookingAdvance}
                      onChange={(e) => setSettings({ ...settings, maximumBookingAdvance: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-border-secondary rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Default Service Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={settings.defaultServiceDuration}
                      onChange={(e) => setSettings({ ...settings, defaultServiceDuration: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-border-secondary rounded-md"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Cancellation Policy
                    </label>
                    <textarea
                      value={settings.cancellationPolicy}
                      onChange={(e) => setSettings({ ...settings, cancellationPolicy: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-border-secondary rounded-md"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-text-primary">Email Notifications</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(settings.emailNotifications).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateEmailNotification(key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-text-primary capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold text-text-primary">SMS Notifications</h2>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(settings.smsNotifications).map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => updateSmsNotification(key, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-text-primary capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      <strong>Note:</strong> SMS notifications require a third-party service and may incur additional costs.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-text-primary">Change Password</h2>
              </CardHeader>
              <CardContent>
                {passwordError && (
                  <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-4 mb-6 bg-green-50 border border-green-200 rounded-lg text-green-800">
                    {passwordSuccess}
                  </div>
                )}

                <form onSubmit={handlePasswordUpdate} className="space-y-6 max-w-md">
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {showPasswords.current ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {showPasswords.new ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                      >
                        {showPasswords.confirm ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="px-6"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <LoaderIcon className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <LockIcon className="w-4 h-4 mr-2" />
                          Update Password
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* System Tab */}
          {activeTab === 'system' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-text-primary">System Information</h2>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">System Version</span>
                      <span className="font-medium">v1.2.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Database Status</span>
                      <span className="text-green-600 font-medium">Connected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Last Backup</span>
                      <span className="font-medium">Today, 3:00 AM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">API Status</span>
                      <span className="text-green-600 font-medium">Operational</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full">
                      <DatabaseIcon className="w-4 h-4 mr-2" />
                      Export Data
                    </Button>
                    <Button variant="outline" className="w-full">
                      <ShieldIcon className="w-4 h-4 mr-2" />
                      Security Audit
                    </Button>
                    <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">
                      Clear Cache
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default function SettingsPageWithProtection() {
  return (
    <AdminRoute>
      <SettingsPage />
    </AdminRoute>
  )
}