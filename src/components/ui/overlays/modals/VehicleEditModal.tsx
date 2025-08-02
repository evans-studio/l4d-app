'use client'

import React, { useState, useEffect } from 'react'
import { Car, Trash2 } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Select } from '@/components/ui/primitives/Select'

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  color?: string
  registration?: string
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
    registration: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  // Removed vehicle sizes - using service pricing instead

  useEffect(() => {
    if (isOpen && data?.vehicle) {
      setFormData({
        make: data.vehicle.make || '',
        model: data.vehicle.model || '',
        year: data.vehicle.year || new Date().getFullYear(),
        color: data.vehicle.color || '',
        registration: data.vehicle.registration || ''
      })
    }
  }, [isOpen, data?.vehicle])

  // Vehicle sizes functionality removed - using service pricing instead

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.make.trim() || !formData.model.trim()) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

        {/* Vehicle size removed - pricing now determined by service selection */}

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