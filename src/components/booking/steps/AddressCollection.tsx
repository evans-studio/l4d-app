'use client'

import { useState, useEffect } from 'react'
import { useBookingFlowStore, useBookingStep } from '@/lib/store/bookingFlowStore'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { Input } from '@/components/ui/primitives/Input'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  MapPinIcon,
  CheckIcon,
  PlusIcon,
  HomeIcon
} from 'lucide-react'

export function AddressCollection() {
  const {
    formData,
    userAddresses,
    isExistingUser,
    isLoading,
    error,
    setAddressData,
    previousStep,
    nextStep,
    canProceedToNextStep
  } = useBookingFlowStore()

  const { isCurrentStep } = useBookingStep(5)
  
  const [showNewAddressForm, setShowNewAddressForm] = useState(!isExistingUser || userAddresses.length === 0)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState({
    street: formData.address?.street || '',
    city: formData.address?.city || '',
    state: formData.address?.state || '',
    zipCode: formData.address?.zipCode || '',
  })

  // Update form when store data changes
  useEffect(() => {
    if (formData.address) {
      setAddressForm({
        street: formData.address.street,
        city: formData.address.city,
        state: formData.address.state,
        zipCode: formData.address.zipCode,
      })
    }
  }, [formData.address])

  const handleFormChange = (field: string, value: string) => {
    setAddressForm(prev => ({ ...prev, [field]: value }))
  }

  const handleExistingAddressSelect = (addressId: string) => {
    const address = userAddresses.find(a => a.id === addressId)
    if (address) {
      setSelectedAddressId(addressId)
      setAddressData({
        street: address.address_line_1,
        city: address.city,
        state: address.county || 'UK',
        zipCode: address.postal_code,
        isExisting: true,
        addressId: address.id
      })
      setShowNewAddressForm(false)
    }
  }

  const handleNewAddressSubmit = () => {
    if (addressForm.street && addressForm.city && addressForm.zipCode) {
      setAddressData({
        ...addressForm,
        isExisting: false
      })
      setSelectedAddressId(null)
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
          Service Location
        </h2>
        <p className="text-text-secondary text-lg">
          Where would you like your vehicle detailed?
        </p>
      </div>

      {/* Service Info */}
      {formData.service && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-text-primary">{formData.service.name}</h3>
                <p className="text-sm text-text-secondary">
                  Mobile service - we come to you!
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary">Estimated Duration</p>
                <p className="font-semibold text-text-primary">
                  ~{Math.round(formData.service.duration / 60)} hours
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Addresses (for returning customers) */}
      {isExistingUser && userAddresses.length > 0 && !showNewAddressForm && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-text-primary">Choose from your saved addresses</h3>
          <div className="grid grid-cols-1 gap-4">
            {userAddresses.map((address) => (
              <Card
                key={address.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedAddressId === address.id
                    ? 'border-brand-500 bg-brand-600/5 shadow-purple-lg'
                    : 'hover:border-brand-400 hover:shadow-purple'
                }`}
                onClick={() => handleExistingAddressSelect(address.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-brand-600/10 flex items-center justify-center">
                        <HomeIcon className="w-6 h-6 text-brand-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-primary">
                          {address.name || 'Service Address'}
                        </h4>
                        <p className="text-sm text-text-secondary">
                          {address.address_line_1}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {address.city}, {address.postal_code}
                        </p>
                      </div>
                    </div>
                    {selectedAddressId === address.id && (
                      <CheckIcon className="w-5 h-5 text-brand-600" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowNewAddressForm(true)}
              leftIcon={<PlusIcon className="w-4 h-4" />}
            >
              Add Different Address
            </Button>
          </div>
        </div>
      )}

      {/* New Address Form */}
      {showNewAddressForm && (
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold text-text-primary">
              {isExistingUser && userAddresses.length > 0 ? 'Add New Address' : 'Service Address'}
            </h3>
            <p className="text-text-secondary">
              Enter the address where you'd like your vehicle detailed
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Street Address *
              </label>
              <Input
                value={addressForm.street}
                onChange={(e) => handleFormChange('street', e.target.value)}
                placeholder="e.g., 123 Main Street"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  City *
                </label>
                <Input
                  value={addressForm.city}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  placeholder="e.g., London"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Postal Code *
                </label>
                <Input
                  value={addressForm.zipCode}
                  onChange={(e) => handleFormChange('zipCode', e.target.value.toUpperCase())}
                  placeholder="e.g., SW1A 1AA"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                State/County
              </label>
              <Input
                value={addressForm.state}
                onChange={(e) => handleFormChange('state', e.target.value)}
                placeholder="e.g., Greater London"
              />
            </div>

            <div className="flex items-center gap-3 pt-4">
              {isExistingUser && userAddresses.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowNewAddressForm(false)}
                >
                  Back to Saved Addresses
                </Button>
              )}
              <Button
                onClick={handleNewAddressSubmit}
                disabled={!addressForm.street || !addressForm.city || !addressForm.zipCode}
                className="flex-1"
                rightIcon={<MapPinIcon className="w-4 h-4" />}
              >
                Use This Address
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Important Notes */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <MapPinIcon className="w-5 h-5 text-brand-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-text-primary mb-2">Service Requirements</h4>
              <ul className="text-sm text-text-secondary space-y-1">
                <li>• Access to water and electricity required</li>
                <li>• Suitable parking space for our equipment</li>
                <li>• Clear access to your vehicle</li>
                <li>• We bring all cleaning supplies and equipment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Selected Address Summary */}
      {formData.address && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-text-primary">Selected Service Location</h3>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between bg-surface-tertiary rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-brand-600 flex items-center justify-center">
                  <MapPinIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">Service Address</h4>
                  <p className="text-sm text-text-secondary">
                    {formData.address.street}
                  </p>
                  <p className="text-sm text-text-secondary">
                    {formData.address.city}, {formData.address.state} {formData.address.zipCode}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-text-secondary">
                  {formData.address.isExisting ? 'Saved Address' : 'New Address'}
                </p>
                <p className="text-xs text-brand-400">Ready for service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button
          variant="outline"
          onClick={previousStep}
          leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
        >
          Back to Services
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canProceedToNextStep() || isLoading}
          size="lg"
          rightIcon={<ChevronRightIcon className="w-4 h-4" />}
        >
          Continue to Confirmation
        </Button>
      </div>
    </div>
  )
}