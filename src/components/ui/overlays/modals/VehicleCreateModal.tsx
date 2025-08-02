'use client'

import React, { useState, useEffect } from 'react'
import { Car, Plus } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Select } from '@/components/ui/primitives/Select'

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
    set_as_default: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [vehicleSizes, setVehicleSizes] = useState<VehicleSize[]>([])

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
        set_as_default: false
      })
      setError('')
    }
  }, [isOpen])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.make.trim() || !formData.model.trim() || !formData.vehicle_size_id) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const response = await fetch('/api/customer/vehicles', {
        method: 'POST',
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
        setError(result.error?.message || 'Failed to create vehicle')
      }
    } catch (error) {
      console.error('Create vehicle error:', error)
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const vehicleSizeOptions = vehicleSizes.map(size => ({
    value: size.id,
    label: `${size.name}${size.price_multiplier ? ` (${size.price_multiplier}x)` : ''}`
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
          <Input
            label="Make"
            placeholder="e.g. BMW, Mercedes, Audi"
            required
            value={formData.make}
            onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
            leftIcon={<Car className="w-4 h-4" />}
          />
          
          <Input
            label="Model"
            placeholder="e.g. 3 Series, C-Class, A4"
            required
            value={formData.model}
            onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Year"
            type="number"
            min="1990"
            max={new Date().getFullYear() + 1}
            value={formData.year}
            onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
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
          placeholder="e.g. AB12 CDE"
          optional
          value={formData.license_plate}
          onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value.toUpperCase() }))}
        />

        <Select
          label="Vehicle Size"
          placeholder="Select vehicle size"
          required
          options={vehicleSizeOptions}
          value={formData.vehicle_size_id}
          onChange={(e) => setFormData(prev => ({ ...prev, vehicle_size_id: e.target.value }))}
          helperText="Vehicle size affects pricing"
          disabled={isLoading}
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