'use client'

import React, { useState, useEffect } from 'react'
import { Car, Trash2 } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  color?: string
  registration?: string
  vehicle_size_id: string
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
    vehicle_size_id: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [vehicleSizes, setVehicleSizes] = useState<Array<{id: string, name: string}>>([])

  useEffect(() => {
    if (isOpen) {
      loadVehicleSizes()
      if (data?.vehicle) {
        setFormData({
          make: data.vehicle.make || '',
          model: data.vehicle.model || '',
          year: data.vehicle.year || new Date().getFullYear(),
          color: data.vehicle.color || '',
          registration: data.vehicle.registration || '',
          vehicle_size_id: data.vehicle.vehicle_size_id || ''
        })
      }
    }
  }, [isOpen, data?.vehicle])

  const loadVehicleSizes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/vehicle-sizes')
      const result = await response.json()
      
      if (result.success) {
        setVehicleSizes(result.data)
      }
    } catch (error) {
      console.error('Failed to load vehicle sizes')
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
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Make *
            </label>
            <Input
              value={formData.make}
              onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
              placeholder="e.g. BMW, Mercedes, Audi"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Model *
            </label>
            <Input
              value={formData.model}
              onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              placeholder="e.g. 3 Series, C-Class, A4"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Year
            </label>
            <Input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
              min="1990"
              max={new Date().getFullYear() + 1}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Color
            </label>
            <Input
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              placeholder="e.g. Black, White, Silver"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Registration Number
          </label>
          <Input
            value={formData.registration}
            onChange={(e) => setFormData(prev => ({ ...prev, registration: e.target.value.toUpperCase() }))}
            placeholder="e.g. AB12 CDE"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Vehicle Size *
          </label>
          <select
            value={formData.vehicle_size_id}
            onChange={(e) => setFormData(prev => ({ ...prev, vehicle_size_id: e.target.value }))}
            className="w-full px-3 py-2 border border-border-secondary rounded-lg focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600"
            required
          >
            <option value="">Select vehicle size</option>
            {vehicleSizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-border-secondary">
          {data?.vehicleId && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </Button>
          )}
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || isLoading}
            leftIcon={<Car className="w-4 h-4" />}
          >
            {isSubmitting ? 'Saving...' : data?.vehicleId ? 'Update Vehicle' : 'Add Vehicle'}
          </Button>
        </div>
      </form>
    </BaseModal>
  )
}

export const VehicleCreateModal: React.FC<BaseOverlayProps> = (props) => {
  // Reuse the VehicleEditModal without a vehicleId to create a new vehicle
  return <VehicleEditModal {...props} data={{ ...props.data, vehicleId: undefined }} />
}