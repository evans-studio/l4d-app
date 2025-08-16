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
  HomeIcon,
  Calculator,
  Clock
} from 'lucide-react'
import { validateUKPostcode, formatUKPostcode } from '@/lib/utils/postcode-distance'

export function AddressCollection() {
  const {
    formData,
    userAddresses,
    isExistingUser,
    isLoading,
    error,
    calculatedPrice,
    setAddressData,
    calculatePrice,
    previousStep,
    nextStep,
    canProceedToNextStep
  } = useBookingFlowStore()

  const { isCurrentStep } = useBookingStep(4)
  
  const [showNewAddressForm, setShowNewAddressForm] = useState(!isExistingUser || userAddresses.length === 0)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState({
    addressLine1: formData.address?.addressLine1 || '',
    addressLine2: formData.address?.addressLine2 || '',
    city: formData.address?.city || '',
    postcode: formData.address?.postcode || '',
  })
  const [postcodeError, setPostcodeError] = useState<string | null>(null)

  // Update form when store data changes
  useEffect(() => {
    if (formData.address) {
      setAddressForm({
        addressLine1: formData.address.addressLine1,
        addressLine2: formData.address.addressLine2 || '',
        city: formData.address.city,
        postcode: formData.address.postcode,
      })
    }
  }, [formData.address])

  const handleFormChange = (field: string, value: string) => {
    setAddressForm(prev => ({ ...prev, [field]: value }))
    
    // Validate postcode as user types
    if (field === 'postcode') {
      const cleanPostcode = value.trim()
      if (cleanPostcode && !validateUKPostcode(cleanPostcode)) {
        setPostcodeError('Please enter a valid UK postcode')
      } else {
        setPostcodeError(null)
      }
    }
  }

  const handleExistingAddressSelect = (addressId: string) => {
    const address = userAddresses.find(a => a.id === addressId)
    if (address) {
      setSelectedAddressId(addressId)
      setAddressData({
        addressLine1: address.address_line_1,
        addressLine2: address.address_line_2 || '',
        city: address.city,
        postcode: address.postal_code,
        isExisting: true,
        addressId: address.id
      })
      setShowNewAddressForm(false)
    }
  }

  const handleNewAddressSubmit = async () => {
    if (addressForm.addressLine1 && addressForm.city && addressForm.postcode && !postcodeError) {
      // Format postcode before saving
      const formattedPostcode = formatUKPostcode(addressForm.postcode)
      
      const addressData = {
        ...addressForm,
        postcode: formattedPostcode,
        isExisting: false
      }
      
      setAddressData(addressData)
      setSelectedAddressId(null)
      
      // Trigger price calculation with new address
      if (formData.service && formData.vehicle) {
        await calculatePrice()
      }
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
              <Input
                label="Street Address *"
                floating
                value={addressForm.addressLine1}
                onChange={(e) => handleFormChange('addressLine1', e.target.value)}
                placeholder="e.g., 123 Main Street"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  label="City *"
                  floating
                  value={addressForm.city}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  placeholder="e.g., London"
                  required
                />
              </div>
              
              <div>
                <Input
                  label="Postcode *"
                  floating
                  value={addressForm.postcode}
                  onChange={(e) => handleFormChange('postcode', e.target.value.toUpperCase())}
                  placeholder="e.g., SW1A 1AA"
                  required
                />
              </div>
            </div>

            {/* County field removed for simplified UK address entry */}

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
                disabled={!addressForm.addressLine1 || !addressForm.city || !addressForm.postcode || !!postcodeError || isLoading}
                className="flex-1"
                rightIcon={<MapPinIcon className="w-4 h-4" />}
              >
                {isLoading ? 'Calculating Price...' : 'Use This Address'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Error Display */}
      {error && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
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
          Back
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canProceedToNextStep() || isLoading}
          size="lg"
          rightIcon={<ChevronRightIcon className="w-4 h-4" />}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}