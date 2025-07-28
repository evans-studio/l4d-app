'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerLayout } from '@/components/layouts/CustomerLayout'
import { Button } from '@/components/ui/primitives/Button'
import { 
  ArrowLeftIcon,
  CarIcon,
  SaveIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  StarIcon
} from 'lucide-react'

interface VehicleSize {
  id: string
  name: string
  description: string
  multiplier: number
  sort_order: number
}

interface VehicleFormData {
  make: string
  model: string
  year: number | null
  color: string
  license_plate: string
  vehicle_size_id: string
  vin: string
  notes: string
  is_primary: boolean
}

const POPULAR_MAKES = [
  'Audi', 'BMW', 'Ford', 'Honda', 'Hyundai', 'Jaguar', 'Land Rover', 'Mercedes-Benz',
  'Mini', 'Nissan', 'Peugeot', 'Renault', 'SEAT', 'Skoda', 'Toyota', 'Vauxhall',
  'Volkswagen', 'Volvo'
]

const POPULAR_COLORS = [
  'Black', 'White', 'Silver', 'Grey', 'Blue', 'Red', 'Green', 'Yellow', 
  'Orange', 'Purple', 'Brown', 'Gold', 'Bronze'
]

export default function AddVehiclePage() {
  const router = useRouter()
  const [vehicleSizes, setVehicleSizes] = useState<VehicleSize[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState('')
  
  const [formData, setFormData] = useState<VehicleFormData>({
    make: '',
    model: '',
    year: null,
    color: '',
    license_plate: '',
    vehicle_size_id: '',
    vin: '',
    notes: '',
    is_primary: false
  })

  // Load vehicle sizes
  useEffect(() => {
    const loadVehicleSizes = async () => {
      try {
        const response = await fetch('/api/vehicle-sizes')
        const data = await response.json()
        
        if (data.success) {
          setVehicleSizes(data.data || [])
          // Set default size to medium if available
          const mediumSize = data.data?.find((size: VehicleSize) => size.name.toLowerCase() === 'medium')
          if (mediumSize) {
            setFormData(prev => ({ ...prev, vehicle_size_id: mediumSize.id }))
          }
        }
      } catch (error) {
        console.error('Failed to load vehicle sizes:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadVehicleSizes()
  }, [])

  const handleInputChange = (field: keyof VehicleFormData, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.make.trim()) {
      newErrors.make = 'Vehicle make is required'
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Vehicle model is required'
    }

    if (!formData.vehicle_size_id) {
      newErrors.vehicle_size_id = 'Please select a vehicle size'
    }

    // Year validation
    if (formData.year) {
      const currentYear = new Date().getFullYear()
      if (formData.year < 1950 || formData.year > currentYear + 1) {
        newErrors.year = `Year must be between 1950 and ${currentYear + 1}`
      }
    }

    // License plate format validation (UK format)
    if (formData.license_plate.trim()) {
      const ukPlateRegex = /^[A-Z]{2}[0-9]{2}\s?[A-Z]{3}$|^[A-Z][0-9]{1,3}\s?[A-Z]{3}$|^[A-Z]{3}\s?[0-9]{1,3}[A-Z]?$/i
      if (!ukPlateRegex.test(formData.license_plate.trim())) {
        newErrors.license_plate = 'Please enter a valid UK license plate'
      }
    }

    // VIN validation
    if (formData.vin.trim()) {
      if (formData.vin.length !== 17) {
        newErrors.vin = 'VIN must be exactly 17 characters'
      } else if (!/^[A-HJ-NPR-Z0-9]{17}$/i.test(formData.vin)) {
        newErrors.vin = 'Please enter a valid VIN (no I, O, or Q characters)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsSaving(true)
      setErrors({})

      const response = await fetch('/api/customer/vehicles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          make: formData.make.trim(),
          model: formData.model.trim(),
          year: formData.year,
          color: formData.color.trim() || null,
          license_plate: formData.license_plate.trim().toUpperCase() || null,
          vehicle_size_id: formData.vehicle_size_id,
          vin: formData.vin.trim().toUpperCase() || null,
          notes: formData.notes.trim() || null,
          is_primary: formData.is_primary
        })
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage('Vehicle added successfully!')
        
        // Redirect after short delay
        setTimeout(() => {
          router.push('/dashboard/vehicles')
        }, 1500)
      } else {
        setErrors({ submit: data.error?.message || 'Failed to add vehicle' })
      }
    } catch (error) {
      console.error('Failed to add vehicle:', error)
      setErrors({ submit: 'Failed to add vehicle. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1949 }, (_, i) => currentYear - i)

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
        </div>
      </CustomerLayout>
    )
  }

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/vehicles')}
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Vehicles
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Add New Vehicle</h1>
              <p className="text-text-secondary">
                Add your vehicle details to make future bookings faster
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-surface-secondary rounded-lg p-6 border border-border-primary">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <CarIcon className="w-5 h-5" />
                  Basic Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Make */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Make *
                    </label>
                    <input
                      list="makes"
                      value={formData.make}
                      onChange={(e) => handleInputChange('make', e.target.value)}
                      placeholder="e.g., BMW"
                      className={`w-full px-3 py-2 bg-surface-primary border rounded-md text-text-primary placeholder-text-muted focus:outline-none transition-colors ${
                        errors.make ? 'border-red-400' : 'border-border-secondary focus:border-brand-400'
                      }`}
                    />
                    <datalist id="makes">
                      {POPULAR_MAKES.map(make => (
                        <option key={make} value={make} />
                      ))}
                    </datalist>
                    {errors.make && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />
                        {errors.make}
                      </p>
                    )}
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Model *
                    </label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => handleInputChange('model', e.target.value)}
                      placeholder="e.g., 3 Series"
                      className={`w-full px-3 py-2 bg-surface-primary border rounded-md text-text-primary placeholder-text-muted focus:outline-none transition-colors ${
                        errors.model ? 'border-red-400' : 'border-border-secondary focus:border-brand-400'
                      }`}
                    />
                    {errors.model && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />
                        {errors.model}
                      </p>
                    )}
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Year
                    </label>
                    <select
                      value={formData.year || ''}
                      onChange={(e) => handleInputChange('year', e.target.value ? parseInt(e.target.value) : null)}
                      className={`w-full px-3 py-2 bg-surface-primary border rounded-md text-text-primary focus:outline-none transition-colors ${
                        errors.year ? 'border-red-400' : 'border-border-secondary focus:border-brand-400'
                      }`}
                    >
                      <option value="">Select year (optional)</option>
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                    {errors.year && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />
                        {errors.year}
                      </p>
                    )}
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Color
                    </label>
                    <input
                      list="colors"
                      value={formData.color}
                      onChange={(e) => handleInputChange('color', e.target.value)}
                      placeholder="e.g., Black"
                      className="w-full px-3 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none transition-colors"
                    />
                    <datalist id="colors">
                      {POPULAR_COLORS.map(color => (
                        <option key={color} value={color} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="bg-surface-secondary rounded-lg p-6 border border-border-primary">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Vehicle Details
                </h3>

                <div className="space-y-4">
                  {/* Vehicle Size */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Vehicle Size *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {vehicleSizes.map((size) => (
                        <label
                          key={size.id}
                          className={`relative flex cursor-pointer rounded-lg border p-4 transition-colors ${
                            formData.vehicle_size_id === size.id
                              ? 'border-brand-purple bg-brand-purple/10'
                              : 'border-border-secondary hover:border-border-primary'
                          }`}
                        >
                          <input
                            type="radio"
                            name="vehicle_size_id"
                            value={size.id}
                            checked={formData.vehicle_size_id === size.id}
                            onChange={(e) => handleInputChange('vehicle_size_id', e.target.value)}
                            className="sr-only"
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-text-primary">
                              {size.name}
                            </span>
                            <span className="text-xs text-text-secondary">
                              {size.description}
                            </span>
                            <span className="text-xs text-text-muted mt-1">
                              Pricing multiplier: {size.multiplier}x
                            </span>
                          </div>
                          {formData.vehicle_size_id === size.id && (
                            <CheckCircleIcon className="absolute top-2 right-2 w-4 h-4 text-brand-purple" />
                          )}
                        </label>
                      ))}
                    </div>
                    {errors.vehicle_size_id && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />
                        {errors.vehicle_size_id}
                      </p>
                    )}
                  </div>

                  {/* License Plate */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      License Plate
                    </label>
                    <input
                      type="text"
                      value={formData.license_plate}
                      onChange={(e) => handleInputChange('license_plate', e.target.value.toUpperCase())}
                      placeholder="e.g., AB12 XYZ"
                      className={`w-full px-3 py-2 bg-surface-primary border rounded-md text-text-primary placeholder-text-muted focus:outline-none transition-colors font-mono ${
                        errors.license_plate ? 'border-red-400' : 'border-border-secondary focus:border-brand-400'
                      }`}
                    />
                    {errors.license_plate && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />
                        {errors.license_plate}
                      </p>
                    )}
                  </div>

                  {/* VIN */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      VIN (Vehicle Identification Number)
                    </label>
                    <input
                      type="text"
                      value={formData.vin}
                      onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                      placeholder="17-character VIN"
                      maxLength={17}
                      className={`w-full px-3 py-2 bg-surface-primary border rounded-md text-text-primary placeholder-text-muted focus:outline-none transition-colors font-mono text-sm ${
                        errors.vin ? 'border-red-400' : 'border-border-secondary focus:border-brand-400'
                      }`}
                    />
                    {errors.vin && (
                      <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />
                        {errors.vin}
                      </p>
                    )}
                    <p className="text-text-muted text-xs mt-1">
                      Optional - helps with insurance and service records
                    </p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Any special notes about your vehicle (modifications, damage, etc.)"
                      rows={3}
                      className="w-full px-3 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none transition-colors resize-none"
                    />
                  </div>

                  {/* Primary Vehicle */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_primary"
                      checked={formData.is_primary}
                      onChange={(e) => handleInputChange('is_primary', e.target.checked)}
                      className="w-4 h-4 text-brand-purple border-border-secondary rounded focus:ring-brand-purple"
                    />
                    <label htmlFor="is_primary" className="text-sm text-text-primary flex items-center gap-2">
                      <StarIcon className="w-4 h-4 text-yellow-500" />
                      Set as primary vehicle
                    </label>
                  </div>
                  <p className="text-text-muted text-xs">
                    Your primary vehicle will be automatically selected during booking
                  </p>
                </div>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="space-y-6">
              <div className="bg-surface-secondary rounded-lg p-6 border border-border-primary sticky top-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Vehicle Preview
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-center w-full h-24 bg-brand-purple/10 rounded-lg">
                    <CarIcon className="w-12 h-12 text-brand-purple" />
                  </div>

                  <div className="text-center">
                    <h4 className="text-lg font-semibold text-text-primary">
                      {formData.make || 'Vehicle Make'} {formData.model || 'Model'}
                    </h4>
                    {formData.year && (
                      <p className="text-text-secondary">{formData.year}</p>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {formData.color && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Color:</span>
                        <span className="text-text-primary">{formData.color}</span>
                      </div>
                    )}
                    
                    {formData.license_plate && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">License:</span>
                        <span className="text-text-primary font-mono">{formData.license_plate}</span>
                      </div>
                    )}

                    {formData.vehicle_size_id && (
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Size:</span>
                        <span className="text-text-primary">
                          {vehicleSizes.find(s => s.id === formData.vehicle_size_id)?.name}
                        </span>
                      </div>
                    )}

                    {formData.is_primary && (
                      <div className="flex items-center justify-center gap-1 text-yellow-600 bg-yellow-50 py-1 px-2 rounded">
                        <StarIcon className="w-3 h-3" />
                        <span className="text-xs">Primary Vehicle</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start gap-2">
                    <InfoIcon className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-blue-800 text-xs">
                        <strong>Tip:</strong> Adding complete vehicle details helps us provide better service estimates and ensures we bring the right equipment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-6 border-t border-border-secondary">
            {errors.submit && (
              <p className="text-red-600 text-sm flex items-center gap-1 mr-auto">
                <AlertCircleIcon className="w-4 h-4" />
                {errors.submit}
              </p>
            )}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/vehicles')}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding Vehicle...
                </>
              ) : (
                <>
                  <SaveIcon className="w-4 h-4" />
                  Add Vehicle
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </CustomerLayout>
  )
}