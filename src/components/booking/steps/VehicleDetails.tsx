'use client'

import { useState, useEffect } from 'react'
import { BookingFlowData, CustomerVehicle, VehicleSize } from '@/lib/utils/booking-types'
import { Button } from '@/components/ui/primitives/Button'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CarIcon } from 'lucide-react'

interface VehicleDetailsProps {
  bookingData: BookingFlowData
  updateBookingData: (updates: Partial<BookingFlowData>) => void
  onNext: () => void
  onPrev: () => void
  setIsLoading: (loading: boolean) => void
}

export function VehicleDetails({ 
  bookingData, 
  updateBookingData, 
  onNext, 
  onPrev,
  setIsLoading 
}: VehicleDetailsProps) {
  const [vehicleSizes, setVehicleSizes] = useState<VehicleSize[]>([])
  const [savedVehicles, setSavedVehicles] = useState<CustomerVehicle[]>([])
  const [showNewVehicleForm, setShowNewVehicleForm] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<CustomerVehicle | null>(
    bookingData.selectedVehicle || null
  )
  const [vehicleForm, setVehicleForm] = useState({
    make: bookingData.vehicleDetails?.make || '',
    model: bookingData.vehicleDetails?.model || '',
    year: bookingData.vehicleDetails?.year || '',
    color: bookingData.vehicleDetails?.color || '',
    registration: bookingData.vehicleDetails?.registration || '',
    size_id: bookingData.vehicleDetails?.size_id || '',
    notes: bookingData.vehicleDetails?.notes || '',
  })

  // Fetch vehicle sizes and saved vehicles
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch vehicle sizes
        const sizesResponse = await fetch('/api/services/vehicle-sizes')
        const sizesData = await sizesResponse.json()
        
        if (sizesData.success) {
          setVehicleSizes(sizesData.data)
        }

        // Fetch saved vehicles (if user is logged in)
        try {
          const vehiclesResponse = await fetch('/api/customer/vehicles')
          const vehiclesData = await vehiclesResponse.json()
          
          if (vehiclesData.success) {
            setSavedVehicles(vehiclesData.data)
          }
        } catch {
          // User might not be logged in, that's ok
          console.log('No saved vehicles (user not logged in)')
        }
      } catch (error) {
        console.error('Failed to fetch vehicle data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [setIsLoading])

  const handleVehicleSelect = (vehicle: CustomerVehicle) => {
    setSelectedVehicle(vehicle)
    setShowNewVehicleForm(false)
    updateBookingData({ 
      selectedVehicle: vehicle,
      vehicleDetails: {
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year,
        color: vehicle.color,
        registration: vehicle.license_plate,
        size_id: vehicle.vehicle_size_id,
        notes: vehicle.notes,
      }
    })
  }

  const handleNewVehicle = () => {
    setSelectedVehicle(null)
    setShowNewVehicleForm(true)
  }

  const handleFormChange = (field: string, value: string | number) => {
    const newForm = { ...vehicleForm, [field]: value }
    setVehicleForm(newForm)
    updateBookingData({ vehicleDetails: {
      ...newForm,
      year: typeof newForm.year === 'string' ? parseInt(newForm.year) || undefined : newForm.year
    } })
  }

  const handleNext = () => {
    if (selectedVehicle || (vehicleForm.make && vehicleForm.model && vehicleForm.size_id)) {
      onNext()
    }
  }

  const isFormValid = selectedVehicle || (vehicleForm.make && vehicleForm.model && vehicleForm.size_id)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
          Vehicle Details
        </h2>
        <p className="text-[var(--text-secondary)] text-lg">
          Tell us about the vehicle you&apos;d like detailed
        </p>
      </div>

      {/* Saved Vehicles */}
      {savedVehicles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
            Select a Saved Vehicle
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedVehicles.map((vehicle) => {
              const vehicleSize = vehicleSizes.find(size => size.id === vehicle.vehicle_size_id)
              const isSelected = selectedVehicle?.id === vehicle.id
              
              return (
                <div
                  key={vehicle.id}
                  onClick={() => handleVehicleSelect(vehicle)}
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
                      <CarIcon className="w-6 h-6 text-[var(--primary)]" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                        {vehicle.name || `${vehicle.make} ${vehicle.model}`}
                      </h4>
                      <p className="text-[var(--text-secondary)] text-sm">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </p>
                      {vehicle.color && (
                        <p className="text-[var(--text-muted)] text-sm">
                          Color: {vehicle.color}
                        </p>
                      )}
                      {vehicleSize && (
                        <p className="text-[var(--primary)] text-sm font-medium mt-2">
                          {vehicleSize.name as string} Size
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
              onClick={handleNewVehicle}
              variant="outline"
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add New Vehicle
            </Button>
          </div>
        </div>
      )}

      {/* New Vehicle Form */}
      {(showNewVehicleForm || savedVehicles.length === 0) && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
            Vehicle Information
          </h3>

          <div className="bg-[var(--surface-secondary)] rounded-lg p-6 space-y-6">
            {/* Make and Model */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Make *
                </label>
                <input
                  type="text"
                  value={vehicleForm.make}
                  onChange={(e) => handleFormChange('make', e.target.value)}
                  placeholder="e.g., BMW, Audi, Ford"
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  value={vehicleForm.model}
                  onChange={(e) => handleFormChange('model', e.target.value)}
                  placeholder="e.g., 3 Series, A4, Focus"
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Year and Color */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Year
                </label>
                <input
                  type="number"
                  value={vehicleForm.year}
                  onChange={(e) => handleFormChange('year', parseInt(e.target.value) || '')}
                  placeholder="e.g., 2020"
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Color
                </label>
                <input
                  type="text"
                  value={vehicleForm.color}
                  onChange={(e) => handleFormChange('color', e.target.value)}
                  placeholder="e.g., Black, White, Silver"
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* License Plate */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                License Plate
              </label>
              <input
                type="text"
                value={vehicleForm.registration}
                onChange={(e) => handleFormChange('registration', e.target.value.toUpperCase())}
                placeholder="e.g., AB12 CDE"
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
              />
            </div>

            {/* Vehicle Size */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-3">
                Vehicle Size *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {vehicleSizes.map((size) => {
                  const isSelected = vehicleForm.size_id === size.id
                  
                  return (
                    <div
                      key={size.id as string}
                      onClick={() => handleFormChange('size_id', size.id as string)}
                      className={`
                        cursor-pointer p-4 rounded-lg border-2 transition-all duration-200
                        ${isSelected 
                          ? 'border-[var(--primary)] bg-[var(--surface-hover)]' 
                          : 'border-[var(--border-secondary)] hover:border-[var(--border-primary)]'
                        }
                      `}
                    >
                      <h4 className={`font-semibold mb-2 ${isSelected ? 'text-[var(--primary)]' : 'text-[var(--text-primary)]'}`}>
                        {size.name as string}
                      </h4>
                      <p className="text-[var(--text-secondary)] text-sm mb-2">
                        {size.description as string}
                      </p>
                      <p className="text-[var(--primary)] font-bold">
                        {size.price_multiplier as number}x pricing
                      </p>
                      <p className="text-[var(--text-muted)] text-xs mt-2">
                        Size details available
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Special Notes
              </label>
              <textarea
                value={vehicleForm.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Any special requirements, damage notes, or access instructions..."
                rows={3}
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button
          onClick={onPrev}
          variant="outline"
          className="flex items-center gap-2"
          size="lg"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Services
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!isFormValid}
          className="flex items-center gap-2"
          size="lg"
        >
          Continue to Address
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}