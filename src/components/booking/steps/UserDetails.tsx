'use client'

import { useState, useEffect } from 'react'
import { useBookingFlowStore, useBookingStep } from '@/lib/store/bookingFlowStore'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card'
import { Input } from '@/components/ui/primitives/Input'
import { ChevronLeftIcon, ChevronRightIcon, UserIcon, CheckCircleIcon, AlertCircleIcon } from 'lucide-react'

export function UserDetails() {
  const {
    formData,
    isExistingUser,
    userVehicles, 
    userAddresses,
    isLoading,
    error,
    setUserData,
    loadExistingUserData,
    previousStep,
    nextStep,
    canProceedToNextStep
  } = useBookingFlowStore()

  const { isCurrentStep } = useBookingStep(5)
  
  const [userForm, setUserForm] = useState({
    email: formData.user?.email || '',
    phone: formData.user?.phone || '',
    name: formData.user?.name || '',
  })
  
  const [validationStatus, setValidationStatus] = useState<'idle' | 'checking' | 'found' | 'new'>('idle')
  const [showUserData, setShowUserData] = useState(false)

  // Update form when store data changes
  useEffect(() => {
    if (formData.user) {
      setUserForm({
        email: formData.user.email,
        phone: formData.user.phone,
        name: formData.user.name,
      })
    }
  }, [formData.user])

  const handleFormChange = (field: string, value: string) => {
    setUserForm(prev => ({ ...prev, [field]: value }))
    
    // Reset validation status when user changes email or phone
    if (field === 'email' || field === 'phone') {
      setValidationStatus('idle')
      setShowUserData(false)
    }
  }

  const handleValidateUser = async () => {
    if (!userForm.email || !userForm.phone) {
      return
    }

    setValidationStatus('checking')
    
    try {
      await loadExistingUserData(userForm.email, userForm.phone)
      
      if (isExistingUser) {
        setValidationStatus('found')
        setShowUserData(true)
        
        // Update the user data in store
        setUserData({
          email: userForm.email,
          phone: userForm.phone,
          name: userForm.name || 'Existing Customer',
          isExistingUser: true
        })
      } else {
        setValidationStatus('new')
        setShowUserData(false)
        
        // Require name for new users
        if (!userForm.name) {
          return
        }
        
        setUserData({
          email: userForm.email,
          phone: userForm.phone,
          name: userForm.name,
          isExistingUser: false
        })
      }
    } catch (error) {
      setValidationStatus('idle')
      console.error('User validation error:', error)
    }
  }

  const handleNext = () => {
    if (canProceedToNextStep()) {
      nextStep()
    }
  }

  if (!isCurrentStep) {
    return <div></div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-text-primary mb-2">
          Your Information
        </h2>
        <p className="text-text-secondary text-lg">
          We'll use this to confirm your booking and send updates
        </p>
      </div>

      {/* User Form */}
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold text-text-primary">Contact Details</h3>
          <p className="text-text-secondary">
            Enter your email and phone number to check for existing account
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Email Address *
            </label>
            <Input
              type="email"
              value={userForm.email}
              onChange={(e) => handleFormChange('email', e.target.value)}
              placeholder="your.email@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Phone Number *
            </label>
            <Input
              type="tel"
              value={userForm.phone}
              onChange={(e) => handleFormChange('phone', e.target.value)}
              placeholder="07123 456789"
              required
            />
          </div>

          {/* Name field - required for new users */}
          {(validationStatus === 'new' || (!isExistingUser && userForm.email && userForm.phone)) && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Full Name *
              </label>
              <Input
                value={userForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>
          )}

          {/* Validation Button */}
          {userForm.email && userForm.phone && validationStatus === 'idle' && (
            <div className="pt-4">
              <Button
                onClick={handleValidateUser}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Checking...' : 'Check Account'}
              </Button>
            </div>
          )}

          {/* Validation Results */}
          {validationStatus === 'checking' && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-700">Checking for existing account...</span>
            </div>
          )}

          {validationStatus === 'found' && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-green-700 font-medium">Welcome back!</p>
                <p className="text-green-600 text-sm">We found your existing account</p>
              </div>
            </div>
          )}

          {validationStatus === 'new' && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircleIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-blue-700 font-medium">New Customer</p>
                <p className="text-blue-600 text-sm">We'll create an account for you after booking</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing User Data Preview */}
      {showUserData && isExistingUser && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Your Account</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Saved Vehicles Preview */}
              {userVehicles.length > 0 && (
                <div>
                  <h4 className="font-medium text-text-primary mb-2">
                    Saved Vehicles ({userVehicles.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {userVehicles.slice(0, 2).map((vehicle) => (
                      <div key={vehicle.id} className="flex items-center gap-2 p-2 bg-surface-tertiary rounded">
                        <UserIcon className="w-4 h-4 text-brand-400" />
                        <span className="text-sm text-text-primary">
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </span>
                      </div>
                    ))}
                    {userVehicles.length > 2 && (
                      <div className="text-sm text-text-secondary p-2">
                        +{userVehicles.length - 2} more vehicles
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Saved Addresses Preview */}
              {userAddresses.length > 0 && (
                <div>
                  <h4 className="font-medium text-text-primary mb-2">
                    Saved Addresses ({userAddresses.length})
                  </h4>
                  <div className="space-y-1">
                    {userAddresses.slice(0, 2).map((address) => (
                      <div key={address.id} className="text-sm text-text-secondary">
                        {address.address_line_1}, {address.city}, {address.postal_code}
                      </div>
                    ))}
                    {userAddresses.length > 2 && (
                      <div className="text-sm text-text-secondary">
                        +{userAddresses.length - 2} more addresses
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {formData.user && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Contact Information</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-surface-tertiary rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">{formData.user.name}</h4>
                  <p className="text-sm text-text-secondary">{formData.user.email}</p>
                  <p className="text-sm text-text-secondary">{formData.user.phone}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-brand-400">
                  {formData.user.isExistingUser ? 'Existing Customer' : 'New Customer'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        {/* Mobile: Stacked */}
        <div className="sm:hidden space-y-3 pt-6">
          <Button
            onClick={handleNext}
            disabled={!canProceedToNextStep() || 
              (validationStatus === 'new' && !userForm.name) ||
              validationStatus === 'checking' ||
              validationStatus === 'idle'
            }
            size="lg"
            fullWidth
            rightIcon={<ChevronRightIcon className="w-4 h-4" />}
            className="min-h-[48px]"
          >
            Continue to Confirmation
          </Button>
          <Button
            variant="outline"
            onClick={previousStep}
            leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
            fullWidth
            className="min-h-[48px]"
          >
            Back to Service Address
          </Button>
        </div>
        
        {/* Desktop: Side by side */}
        <div className="hidden sm:flex justify-between items-center pt-6">
          <Button
            variant="outline"
            onClick={previousStep}
            leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
          >
            Back to Service Address
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceedToNextStep() || 
              (validationStatus === 'new' && !userForm.name) ||
              validationStatus === 'checking' ||
              validationStatus === 'idle'
            }
            size="lg"
            rightIcon={<ChevronRightIcon className="w-4 h-4" />}
          >
            Continue to Confirmation
          </Button>
        </div>
      </div>
    </div>
  )
}