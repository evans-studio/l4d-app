'use client'

import React, { useState, useEffect } from 'react'
import { Car, Plus } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Select } from '@/components/ui/primitives/Select'
import vehicleData from '@/data/vehicle-size-data.json'
import { formatLicensePlateInput, getRandomLicensePlateExample } from '@/lib/utils/license-plate'
import { logger } from '@/lib/utils/logger'

interface VehicleSize {
  id: string
  name: string
  description?: string
  price_multiplier?: number
}

interface CreateVehicleData {
  make: string
  model: string
  year: number
  color: string
  license_plate: string
  vehicle_size_id: string
  detected_size?: string
  set_as_default?: boolean
}

export const VehicleCreateModal: React.FC<BaseOverlayProps> = ({
  isOpen,
  onClose,
  onConfirm
}) => {
  const [formData, setFormData] = useState<CreateVehicleData>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    license_plate: '',
    vehicle_size_id: '',
    detected_size: '',
    set_as_default: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [vehicleSizes, setVehicleSizes] = useState<VehicleSize[]>([])
  const [licensePlateError, setLicensePlateError] = useState<string | undefined>(undefined)

  // Get available makes from vehicle data
  const availableMakes = vehicleData.vehicles.map(v => v.make).sort()

  // Get available models for selected make (deduplicated)
  const availableModels = formData.make 
    ? (() => {
        const allModels = vehicleData.vehicles.find(v => v.make === formData.make)?.models || []
        // Deduplicate models by name, keeping the first occurrence
        const uniqueModels = allModels.filter((model, index, array) => 
          array.findIndex(m => m.model === model.model) === index
        )
        return uniqueModels
      })()
    : []

  // Get available years for selected make/model
  const availableYears = formData.make && formData.model
    ? availableModels.find(m => m.model === formData.model)?.years || []
    : []

  // Get size for selected make/model (auto-detection with duplicate handling)
  const getVehicleSize = (make: string, model: string): string => {
    logger.debug('🔍 Auto-detecting size for:', { make, model })
    const vehicleMake = vehicleData.vehicles.find(v => v.make === make)
    if (vehicleMake) {
      // Find the first matching model (handles duplicates by taking first occurrence)
      const vehicleModel = vehicleMake.models.find(m => m.model === model)
      if (vehicleModel) {
        logger.debug('✅ Size detected', { size: vehicleModel.size })
        return vehicleModel.size
      } else {
        logger.warn('⚠️ Model not found in data', { model })
      }
    } else {
      logger.warn('⚠️ Make not found in data', { make })
    }
    logger.warn('❌ Size detection failed for', { make, model })
    return ''
  }


  useEffect(() => {
    if (isOpen) {
      loadVehicleSizes()
      // Reset form when modal opens
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        license_plate: '',
        vehicle_size_id: '',
        detected_size: '',
        set_as_default: false
      })
      setError('')
    }
  }, [isOpen])

  // Auto-detect size when make/model changes
  useEffect(() => {
    logger.debug('🔄 Auto-detection triggered:', { make: formData.make, model: formData.model, vehicleSizesLoaded: vehicleSizes.length > 0 })
    
    if (formData.make && formData.model) {
      const detectedSize = getVehicleSize(formData.make, formData.model)
      logger.debug('📊 Detected size', { detectedSize })
      
      if (detectedSize) {
        // Find the corresponding vehicle size ID
        const sizeRecord = vehicleSizes.find(size => 
          size.name.toLowerCase() === {
            'S': 'small',
            'M': 'medium', 
            'L': 'large',
            'XL': 'extra large'
          }[detectedSize]?.toLowerCase()
        )
        
        logger.debug('📍 Size record found', { sizeRecord })
        
        setFormData(prev => {
          const updated = {
            ...prev,
            detected_size: detectedSize,
            vehicle_size_id: sizeRecord?.id || ''
          }
          logger.debug('💾 Form updated with size', { detected_size: updated.detected_size, vehicle_size_id: updated.vehicle_size_id })
          return updated
        })
      } else {
        logger.warn('⚠️ No size detected - clearing vehicle_size_id')
        setFormData(prev => ({
          ...prev,
          detected_size: '',
          vehicle_size_id: ''
        }))
      }
    }
  }, [formData.make, formData.model, vehicleSizes])

  const loadVehicleSizes = async () => {
    try {
      logger.debug('🔄 Loading vehicle sizes from API...')
      setIsLoading(true)
      const response = await fetch('/api/services/vehicle-sizes')
      const result = await response.json()
      
      logger.debug('📡 Vehicle sizes API response:', result)
      
      if (result.success) {
        logger.debug('✅ Vehicle sizes loaded', { count: result.data?.length || 0, unit: 'sizes' })
        setVehicleSizes(result.data || [])
      } else {
        logger.error('❌ Failed to load vehicle sizes', result.error instanceof Error ? result.error : undefined)
        setVehicleSizes([]) // Ensure it's an empty array, not undefined
      }
    } catch (error) {
      logger.error('❌ Vehicle sizes API error', error instanceof Error ? error : undefined)
      setVehicleSizes([]) // Ensure it's an empty array on error
    } finally {
      setIsLoading(false)
      logger.debug('🏁 Vehicle sizes loading complete')
    }
  }



  const handleFormChange = (field: string, value: unknown) => {
    setFormData(prev => {
      const newForm = { ...prev, [field]: value }
      
      // Reset dependent fields when make changes
      if (field === 'make') {
        newForm.model = ''
        newForm.year = new Date().getFullYear()
        newForm.detected_size = ''
        newForm.vehicle_size_id = ''
      }
      
      // Reset year when model changes
      if (field === 'model') {
        newForm.year = new Date().getFullYear()
      }
      
      return newForm
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    logger.debug('📝 Form submission attempted with data:', {
      make: formData.make?.trim(),
      model: formData.model?.trim(), 
      license_plate: formData.license_plate?.trim(),
      vehicle_size_id: formData.vehicle_size_id,
      detected_size: formData.detected_size,
      vehicleSizesLoaded: vehicleSizes.length,
      isLoading: isLoading
    })
    
    logger.debug('🔍 Full form data state:', formData)
    logger.debug('📊 Available vehicle sizes:', vehicleSizes)
    
    if (!formData.make.trim() || !formData.model.trim() || !formData.license_plate.trim()) {
      const missing = []
      if (!formData.make.trim()) missing.push('make')
      if (!formData.model.trim()) missing.push('model')
      if (!formData.license_plate.trim()) missing.push('registration number')
      
      const errorMsg = `Please fill in all required fields: ${missing.join(', ')}`
      logger.error('❌ Validation failed - missing fields:', missing)
      setError(errorMsg)
      return
    }
    
    // Check if vehicle size was auto-detected
    if (!formData.vehicle_size_id) {
      logger.error('❌ Validation failed - no vehicle_size_id:', {
        detected_size: formData.detected_size,
        vehicleSizes: vehicleSizes.length,
        make: formData.make,
        model: formData.model
      })
      setError('Sorry, we don\'t have pricing information for this vehicle. Please contact us for assistance.')
      return
    }
    
    logger.debug('✅ Validation passed, proceeding with submission')
    logger.debug('📤 [Frontend] Sending data to backend', { formData })

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch('/api/customer/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      logger.debug('📨 [Frontend] API Response status', { status: response.status, statusText: response.statusText })
      
      const result = await response.json()
      logger.debug('📥 [Frontend] API Response data', { result })

      if (result.success) {
        if (onConfirm) {
          await onConfirm(result.data)
        }
        onClose()
      } else {
        setError(result.error?.message || 'Failed to create vehicle')
      }
    } catch (error) {
      logger.error('Create vehicle error:', error)
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create options for dropdowns
  const makeOptions = availableMakes.map(make => ({
    value: make,
    label: make
  }))

  const modelOptions = availableModels.map((model, index) => ({
    value: model.model,
    label: model.model,
    // Use index as additional key differentiator if needed
    key: `${formData.make}-${model.model}-${index}`
  }))

  const yearOptions = availableYears.map(year => ({
    value: year.toString(),
    label: year.toString()
  }))



  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Vehicle"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Make"
            placeholder="Select vehicle make"
            required
            options={makeOptions}
            value={formData.make}
            onChange={(e) => handleFormChange('make', e.target.value)}
            leftIcon={<Car className="w-4 h-4" />}
          />
          
          <Select
            label="Model"
            placeholder="Select vehicle model"
            required
            options={modelOptions}
            value={formData.model}
            onChange={(e) => handleFormChange('model', e.target.value)}
            disabled={!formData.make}
            helperText={!formData.make ? "Select a make first" : ""}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Year (Optional)"
            placeholder="Select year"
            options={yearOptions}
            value={formData.year.toString()}
            onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
            disabled={!formData.model}
            helperText={!formData.model ? "Select a model first" : ""}
          />
          
          {/* Vehicle Size Indicator - Shows detected size to customer */}
          {isLoading && formData.make && formData.model && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm text-blue-700 font-medium">
                Detecting vehicle size...
              </span>
            </div>
          )}
          
          {!isLoading && formData.detected_size && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700 font-medium">
                Vehicle Size: {{
                  'S': 'Small Vehicle',
                  'M': 'Medium Vehicle', 
                  'L': 'Large Vehicle',
                  'XL': 'Extra Large Vehicle'
                }[formData.detected_size] || formData.detected_size}
              </span>
            </div>
          )}
          
          {!isLoading && formData.make && formData.model && !formData.detected_size && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-sm text-orange-700 font-medium">
                Vehicle size could not be determined automatically
              </span>
            </div>
          )}
          
          <Input
            label="Color (Optional)"
            placeholder="e.g. Black, White, Silver"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
          />
        </div>

        <Input
          label="Registration Number"
          placeholder={`e.g. ${getRandomLicensePlateExample()}`}
          required
          value={formData.license_plate}
          onChange={(e) => {
            const { formatted, error } = formatLicensePlateInput(e.target.value)
            setFormData(prev => ({ ...prev, license_plate: formatted }))
            setLicensePlateError(error || undefined)
          }}
          error={licensePlateError}
          helperText={licensePlateError || "UK license plate format"}
        />



        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="set_as_default"
            checked={formData.set_as_default}
            onChange={(e) => setFormData(prev => ({ ...prev, set_as_default: e.target.checked }))}
            className="w-4 h-4 text-brand-600 bg-surface-card border-border-secondary rounded focus:ring-brand-500 focus:ring-2"
          />
          <label htmlFor="set_as_default" className="text-sm text-text-primary">
            Set as default vehicle
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-border-secondary">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || isLoading}
            leftIcon={<Plus className="w-4 h-4" />}
            className="flex-1"
          >
            {isSubmitting ? 'Creating...' : 'Add Vehicle'}
          </Button>
        </div>
      </form>
    </BaseModal>
  )
}