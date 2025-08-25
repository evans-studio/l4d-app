'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { Button } from '@/components/ui/primitives/Button'
import { 
  EyeIcon,
  EyeOffIcon,
  LoaderIcon
} from 'lucide-react'

interface BusinessSettings {
  businessName: string
  businessAddress: string
  businessPhone: string
  businessEmail: string
  cancellationPolicy: string
}

function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings>({
    businessName: 'Love 4 Detailing',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    cancellationPolicy: '24 hours notice required for cancellations. Full refund available within policy.',
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('business')
  const [auditResults, setAuditResults] = useState<{ name: string; status: 'pass' | 'warn' | 'fail'; details?: string }[] | null>(null)

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

  // Removed operating hours and notifications management as they are not used

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
    { id: 'business', label: 'Business Info' },
    { id: 'booking', label: 'Booking Rules' },
    { id: 'password', label: 'Password' },
    { id: 'system', label: 'System' }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Settings</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
            <p className="text-text-secondary">Configure your business settings and preferences</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
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
        <div className="border-b border-border-secondary overflow-x-auto">
          <nav className="flex gap-6 min-w-max px-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-3 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-brand-purple text-brand-purple'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
                  }
                `}
              >
                {tab.label}
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
                      className="w-full px-4 py-3 bg-surface-primary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-text-primary placeholder:text-text-secondary"
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
                      className="w-full px-4 py-3 bg-surface-primary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-text-primary placeholder:text-text-secondary"
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
                      className="w-full px-4 py-3 bg-surface-primary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-text-primary placeholder:text-text-secondary"
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
                      className="w-full px-4 py-3 bg-surface-primary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-text-primary placeholder:text-text-secondary"
                    />
                  </div>
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
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Cancellation Policy
                  </label>
                  <textarea
                    value={settings.cancellationPolicy}
                    onChange={(e) => setSettings({ ...settings, cancellationPolicy: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-surface-primary border border-border-primary rounded-lg focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple text-text-primary placeholder:text-text-secondary"
                  />
                </div>
              </CardContent>
            </Card>
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
                        'Update Password'
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
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        setIsLoading(true)
                        setError('')
                        setSuccess('')
                        try {
                          const res = await fetch('/api/admin/system/export')
                          if (!res.ok) throw new Error('Export failed')
                          const blob = await res.blob()
                          const url = window.URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `system-export-${new Date().toISOString().slice(0,10)}.json`
                          a.click()
                          window.URL.revokeObjectURL(url)
                          setSuccess('Data export downloaded')
                        } catch (e) {
                          setError('Failed to export data')
                        } finally {
                          setIsLoading(false)
                        }
                      }}
                    >Export Data</Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        setIsLoading(true)
                        setError('')
                        setSuccess('')
                        setAuditResults(null)
                        try {
                          const res = await fetch('/api/admin/system/security-audit', { method: 'POST' })
                          const data = await res.json()
                          if (!data?.success) throw new Error('Audit failed')
                          setSuccess('Security audit completed')
                          const checks = (data.data?.checks || []) as { name: string; status: 'pass' | 'warn' | 'fail'; details?: string }[]
                          setAuditResults(checks)
                        } catch (e) {
                          setError('Failed to run security audit')
                        } finally {
                          setIsLoading(false)
                        }
                      }}
                    >Security Audit</Button>

                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={async () => {
                        setIsLoading(true)
                        setError('')
                        setSuccess('')
                        try {
                          const res = await fetch('/api/admin/system/clear-cache', { method: 'POST' })
                          const data = await res.json()
                          if (!data?.success) throw new Error('Clear cache failed')
                          setSuccess('Cache cleared')
                        } catch (e) {
                          setError('Failed to clear cache')
                        } finally {
                          setIsLoading(false)
                        }
                      }}
                    >Clear Cache</Button>
                  </div>
                </div>
                {auditResults && (
                  <div className="mt-6">
                    <h3 className="text-md font-medium mb-3">Audit Results</h3>
                    <div className="divide-y divide-border-secondary rounded-lg border border-border-secondary bg-surface-primary">
                      {auditResults.map((c, idx) => (
                        <div key={idx} className="flex items-start justify-between p-3">
                          <div>
                            <div className="text-sm font-medium text-text-primary">{c.name}</div>
                            {c.details && (
                              <div className="text-xs text-text-secondary mt-1 max-w-3xl break-words">{c.details}</div>
                            )}
                          </div>
                          <span className={
                            c.status === 'pass' ? 'text-green-600 text-xs font-semibold' :
                            c.status === 'warn' ? 'text-amber-600 text-xs font-semibold' :
                            'text-red-600 text-xs font-semibold'
                          }>
                            {c.status.toUpperCase()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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