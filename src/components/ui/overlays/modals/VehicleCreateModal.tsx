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

interface CreateVehicleData {
  make: string
  model: string
  year: number
  color: string
  license_plate: string
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
    set_as_default: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [licensePlateError, setLicensePlateError] = useState<string | undefined>(undefined)

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


  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        license_plate: '',
        set_as_default: false
      })
      setError('')
    }
  }, [isOpen])



  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => {
      const newForm = { ...prev, [field]: value }
      
      // Reset dependent fields when make changes
      if (field === 'make') {
        newForm.model = ''
        newForm.year = new Date().getFullYear()
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
    
    if (!formData.make.trim() || !formData.model.trim() || !formData.license_plate.trim()) {
      setError('Please fill in all required fields (make, model, and registration number)')
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

  // Create options for dropdowns
  const makeOptions = availableMakes.map(make => ({
    value: make,
    label: make
  }))

  const modelOptions = availableModels.map(model => ({
    value: model.model,
    label: model.model
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
            disabled={isSubmitting}
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