'use client'

import React, { useState, useEffect } from 'react'
import { Car, Trash2 } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Select } from '@/components/ui/primitives/Select'
import vehicleData from '@/data/vehicle-size-data.json'
import { formatLicensePlateInput, getRandomLicensePlateExample } from '@/lib/utils/license-plate'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  color?: string
  registration?: string
}

interface VehicleSize {
  id: string
  name: string
  description?: string
  price_multiplier?: number
}

interface VehicleEditModalProps extends BaseOverlayProps {
  data: {
    vehicleId?: string
    vehicle?: Vehicle
  }
}

export const VehicleEditModal: React.FC<VehicleEditModalProps> = ({
  isOpen,
  onClose,
  data,
  onConfirm
}) => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    registration: '',
    vehicle_size_id: '',
    detected_size: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [vehicleSizes, setVehicleSizes] = useState<VehicleSize[]>([])
  const [licensePlateError, setLicensePlateError] = useState<string | undefined>(undefined)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  // Get available makes from vehicle data
  const availableMakes = vehicleData.vehicles.map(v => v.make).sort()

  // Get available models for selected make
  const availableModels = formData.make 
    ? vehicleData.vehicles.find(v => v.make === formData.make)?.models || []
    : []

  // Get available years for selected make/model
  const availableYears = formData.make && formData.model
    ? availableModels.find(m => m.model === formData.model)?.years || []
    : []

  // Get size for selected make/model (auto-detection)
  const getVehicleSize = (make: string, model: string): string => {
    const vehicleMake = vehicleData.vehicles.find(v => v.make === make)
    if (vehicleMake) {
      const vehicleModel = vehicleMake.models.find(m => m.model === model)
      if (vehicleModel) {
        return vehicleModel.size
      }
    }
    return ''
  }

  useEffect(() => {
    if (isOpen && data?.vehicle) {
      setFormData({
        make: data.vehicle.make || '',
        model: data.vehicle.model || '',
        year: data.vehicle.year || new Date().getFullYear(),
        color: data.vehicle.color || '',
        registration: data.vehicle.registration || '',
        vehicle_size_id: '',
        detected_size: ''
      })
      loadVehicleSizes()
    } else if (isOpen) {
      loadVehicleSizes()
    }
  }, [isOpen, data?.vehicle])

  // Auto-detect size when make/model changes
  useEffect(() => {
    if (formData.make && formData.model) {
      const detectedSize = getVehicleSize(formData.make, formData.model)
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
        
        setFormData(prev => ({
          ...prev,
          detected_size: detectedSize,
          vehicle_size_id: sizeRecord?.id || ''
        }))
      }
    }
  }, [formData.make, formData.model, vehicleSizes])

  const loadVehicleSizes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/vehicle-sizes')
      const result = await response.json()
      
      if (result.success) {
        setVehicleSizes(result.data || [])
      } else {
        console.error('Failed to load vehicle sizes:', result.error)
      }
    } catch (error) {
      console.error('Failed to load vehicle sizes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormChange = (field: string, value: any) => {
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
    
    if (!formData.make.trim() || !formData.model.trim() || !formData.vehicle_size_id) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const url = data?.vehicleId 
        ? `/api/customer/vehicles/${data.vehicleId}` 
        : '/api/customer/vehicles'
      
      const method = data?.vehicleId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (result.success) {
        if (onConfirm) {
          await onConfirm(result.data)
        }
        onClose()
      } else {
        setError(result.error?.message || 'Failed to save vehicle')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!data?.vehicleId) return
    
    if (!confirm('Are you sure you want to delete this vehicle? This action cannot be undone.')) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/customer/vehicles/${data.vehicleId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        if (onConfirm) {
          await onConfirm({ deleted: true })
        }
        onClose()
      } else {
        setError(result.error?.message || 'Failed to delete vehicle')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={data?.vehicleId ? "Edit Vehicle" : "Add Vehicle"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Make"
            placeholder="Select vehicle make"
            required
            options={vehicleData.vehicles.map(v => ({ value: v.make, label: v.make })).sort((a, b) => a.label.localeCompare(b.label))}
            value={formData.make}
            onChange={(e) => handleFormChange('make', e.target.value)}
            leftIcon={<Car className="w-4 h-4" />}
          />
          
          <Select
            label="Model"
            placeholder="Select vehicle model"
            required
            options={availableModels.map(model => ({ value: model.model, label: model.model }))}
            value={formData.model}
            onChange={(e) => handleFormChange('model', e.target.value)}
            disabled={!formData.make}
            helperText={!formData.make ? "Select a make first" : ""}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Year"
            placeholder="Select year"
            required
            options={availableYears.map(year => ({ value: year.toString(), label: year.toString() }))}
            value={formData.year.toString()}
            onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
            disabled={!formData.model}
            helperText={!formData.model ? "Select a model first" : ""}
          />
          
          <Input
            label="Color"
            placeholder="e.g. Black, White, Silver"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
          />
        </div>

        <Input
          label="Registration Number"
          placeholder={`e.g. ${getRandomLicensePlateExample()}`}
          optional
          value={formData.registration}
          onChange={(e) => {
            const { formatted, error } = formatLicensePlateInput(e.target.value)
            setFormData(prev => ({ ...prev, registration: formatted }))
            setLicensePlateError(error || undefined)
          }}
          error={licensePlateError}
          helperText={licensePlateError || "UK license plate format (optional)"}
        />

        <Select
          label="Vehicle Size"
          placeholder="Select vehicle size"
          required
          options={vehicleSizes.map(size => ({
            value: size.id,
            label: `${size.name}${size.price_multiplier ? ` (${size.price_multiplier}x)` : ''}`
          }))}
          value={formData.vehicle_size_id}
          onChange={(e) => setFormData(prev => ({ ...prev, vehicle_size_id: e.target.value }))}
          helperText={
            formData.detected_size 
              ? `Auto-detected: ${formData.detected_size} (${['S', 'M', 'L', 'XL'].includes(formData.detected_size) ? 
                  { 'S': 'Small', 'M': 'Medium', 'L': 'Large', 'XL': 'Extra Large' }[formData.detected_size] : formData.detected_size})`
              : "Vehicle size affects pricing"
          }
          disabled={isLoading}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Actions - Mobile optimized */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border-secondary">
          {data?.vehicleId && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="min-h-[44px] sm:min-h-[40px] order-3 sm:order-1"
            >
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <div className="flex gap-3 order-1 sm:order-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[40px]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              leftIcon={<Car className="w-4 h-4" />}
              className="flex-1 sm:flex-none min-h-[44px] sm:min-h-[40px]"
            >
              {isSubmitting ? 'Saving...' : data?.vehicleId ? 'Update Vehicle' : 'Add Vehicle'}
            </Button>
          </div>
        </div>
      </form>
    </BaseModal>
  )
}

export const VehicleCreateModal: React.FC<BaseOverlayProps> = (props) => {
  // Reuse the VehicleEditModal without a vehicleId to create a new vehicle
  return <VehicleEditModal {...props} data={{ ...props.data, vehicleId: undefined }} />
}