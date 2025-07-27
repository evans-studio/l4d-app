'use client'

import { useState, useEffect } from 'react'
import { BookingFlowData, CustomerAddress } from '@/lib/utils/booking-types'
import { Button } from '@/components/ui/primitives/Button'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, MapPinIcon, LoaderIcon } from 'lucide-react'

interface AddressCollectionProps {
  bookingData: BookingFlowData
  updateBookingData: (updates: Partial<BookingFlowData>) => void
  onNext: () => void
  onPrev: () => void
  setIsLoading: (loading: boolean) => void
}

export function AddressCollection({ 
  bookingData, 
  updateBookingData, 
  onNext, 
  onPrev,
  setIsLoading 
}: AddressCollectionProps) {
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([])
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(
    bookingData.selectedAddress || null
  )
  const [addressForm, setAddressForm] = useState({
    name: bookingData.addressDetails?.name || '',
    address_line_1: bookingData.addressDetails?.address_line_1 || '',
    address_line_2: bookingData.addressDetails?.address_line_2 || '',
    city: bookingData.addressDetails?.city || '',
    postal_code: bookingData.addressDetails?.postcode || '',
  })
  const [distanceInfo, setDistanceInfo] = useState<{
    distanceKm: number
    surcharge: number
    freeDeliveryRadius: number
    surchargePerKm: number
  } | null>(null)
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false)

  // Fetch saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/customer/addresses')
        const data = await response.json()
        
        if (data.success) {
          setSavedAddresses(data.data)
        }
      } catch {
        // User might not be logged in, that's ok
        console.log('No saved addresses (user not logged in)')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAddresses()
  }, [setIsLoading])

  // Calculate distance when postal code is entered
  useEffect(() => {
    const calculateDistance = async () => {
      const postalCode = selectedAddress?.postal_code || addressForm.postal_code
      
      if (postalCode && postalCode.length >= 5) {
        setIsCalculatingDistance(true)
        try {
          const response = await fetch('/api/pricing/distance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postcode: postalCode })
          })
          const data = await response.json()
          
          if (data.success) {
            setDistanceInfo(data.data)
          }
        } catch (error) {
          console.error('Failed to calculate distance:', error)
        } finally {
          setIsCalculatingDistance(false)
        }
      }
    }

    const debounceTimer = setTimeout(calculateDistance, 500)
    return () => clearTimeout(debounceTimer)
  }, [selectedAddress?.postal_code, addressForm.postal_code])

  const handleAddressSelect = (address: CustomerAddress) => {
    setSelectedAddress(address)
    setShowNewAddressForm(false)
    updateBookingData({ 
      selectedAddress: address,
      addressDetails: {
        name: address.name || 'Selected Address',
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2,
        city: address.city,
        postcode: address.postal_code,
      }
    })
  }

  const handleNewAddress = () => {
    setSelectedAddress(null)
    setShowNewAddressForm(true)
  }

  const handleFormChange = (field: string, value: string) => {
    const newForm = { ...addressForm, [field]: value }
    setAddressForm(newForm)
    
    // Transform postal_code to postcode for booking data
    const { postal_code, ...restData } = newForm
    const transformedData = {
      ...restData,
      postcode: postal_code
    }
    
    updateBookingData({ addressDetails: transformedData })
  }

  const handleNext = () => {
    if (selectedAddress || (addressForm.address_line_1 && addressForm.city && addressForm.postal_code)) {
      onNext()
    }
  }

  const isFormValid = selectedAddress || (addressForm.address_line_1 && addressForm.city && addressForm.postal_code)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Service Location
        </h2>
        <p className="text-[var(--text-secondary)] text-lg">
          Where would you like your vehicle detailed?
        </p>
      </div>

      {/* Saved Addresses */}
      {savedAddresses.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
            Select a Saved Address
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedAddresses.map((address) => {
              const isSelected = selectedAddress?.id === address.id
              
              return (
                <div
                  key={address.id}
                  onClick={() => handleAddressSelect(address)}
                  className={`
                    relative bg-[var(--surface-secondary)] rounded-lg p-6 cursor-pointer transition-all duration-200 border-2
                    ${isSelected 
                      ? 'border-[var(--primary)] bg-[var(--surface-hover)]' 
                      : 'border-[var(--border-secondary)] hover:border-[var(--border-primary)]'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className="bg-[var(--surface-tertiary)] rounded-lg p-3">
                      <MapPinIcon className="w-6 h-6 text-[var(--primary)]" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                        {address.name || 'Address'}
                      </h4>
                      <p className="text-[var(--text-secondary)] text-sm">
                        {address.address_line_1}
                        {address.address_line_2 && <>, {address.address_line_2}</>}
                      </p>
                      <p className="text-[var(--text-secondary)] text-sm">
                        {address.city}, {address.postal_code}
                      </p>
                      
                      {address.distance_from_base && (
                        <p className="text-[var(--primary)] text-sm font-medium mt-2">
                          ~{address.distance_from_base}km from base
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="text-center">
            <Button
              onClick={handleNewAddress}
              variant="outline"
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add New Address
            </Button>
          </div>
        </div>
      )}

      {/* New Address Form */}
      {(showNewAddressForm || savedAddresses.length === 0) && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
            Service Address
          </h3>

          <div className="bg-[var(--surface-secondary)] rounded-lg p-6 space-y-6">
            {/* Address Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Address Name
              </label>
              <input
                type="text"
                value={addressForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="e.g., Home, Work, Mum's House"
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
              />
            </div>

            {/* Address Line 1 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Address Line 1 *
              </label>
              <input
                type="text"
                value={addressForm.address_line_1}
                onChange={(e) => handleFormChange('address_line_1', e.target.value)}
                placeholder="House number and street name"
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
              />
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Address Line 2
              </label>
              <input
                type="text"
                value={addressForm.address_line_2}
                onChange={(e) => handleFormChange('address_line_2', e.target.value)}
                placeholder="Apartment, suite, unit, etc. (optional)"
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
              />
            </div>

            {/* City and Postal Code */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={addressForm.city}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  placeholder="e.g., Nottingham"
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Postal Code *
                </label>
                <input
                  type="text"
                  value={addressForm.postal_code}
                  onChange={(e) => handleFormChange('postal_code', e.target.value.toUpperCase())}
                  placeholder="e.g., NG5 1FB"
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distance Information */}
      {(selectedAddress?.postal_code || addressForm.postal_code) && (
        <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-primary)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Distance & Travel Information
          </h3>
          
          {isCalculatingDistance ? (
            <div className="flex items-center gap-3 text-[var(--text-secondary)]">
              <LoaderIcon className="w-5 h-5 animate-spin" />
              <span>Calculating distance...</span>
            </div>
          ) : distanceInfo ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Distance from our base:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {distanceInfo.distanceKm}km
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)]">Travel surcharge:</span>
                <span className="font-semibold text-[var(--primary)]">
                  {distanceInfo.surcharge > 0 ? `£${distanceInfo.surcharge}` : 'FREE'}
                </span>
              </div>
              
              {distanceInfo.surcharge === 0 && (
                <div className="bg-[var(--success-bg)] border border-[var(--success)] rounded-md p-3">
                  <p className="text-[var(--success)] text-sm">
                    🎉 You&apos;re within our free delivery radius of {distanceInfo.freeDeliveryRadius}km!
                  </p>
                </div>
              )}
              
              {distanceInfo.surcharge > 0 && (
                <div className="bg-[var(--info-bg)] border border-[var(--info)] rounded-md p-3">
                  <p className="text-[var(--info)] text-sm">
                    Travel surcharge of £{distanceInfo.surchargePerKm}/km applies beyond {distanceInfo.freeDeliveryRadius}km
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">
              Enter a valid postal code to calculate travel distance and any surcharges
            </p>
          )}
        </div>
      )}

      {/* Important Notes */}
      <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          Service Requirements
        </h3>
        <div className="space-y-2 text-[var(--text-secondary)]">
          <p className="flex items-start gap-2">
            <span className="text-[var(--primary)] mt-1">•</span>
            <span>Access to water supply (garden tap or similar)</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-[var(--primary)] mt-1">•</span>
            <span>Power source within 50m (for equipment)</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-[var(--primary)] mt-1">•</span>
            <span>Vehicle accessible for cleaning (not blocked in)</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-[var(--primary)] mt-1">•</span>
            <span>Level ground preferred for safety</span>
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button
          onClick={onPrev}
          variant="outline"
          className="flex items-center gap-2"
          size="lg"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Vehicle
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!isFormValid}
          className="flex items-center gap-2"
          size="lg"
        >
          Continue to Time Selection
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}