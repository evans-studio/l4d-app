'use client'

import React, { useState, useEffect } from 'react'
import { MapPin, Trash2 } from 'lucide-react'
import { BaseModal } from '../BaseModal'
import { BaseOverlayProps } from '@/lib/overlay/types'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'

interface Address {
  id: string
  address_line_1: string
  address_line_2?: string
  city: string
  postal_code: string
  special_instructions?: string
}

interface AddressEditModalProps extends BaseOverlayProps {
  data: {
    addressId?: string
    address?: Address
  }
}

export const AddressEditModal: React.FC<AddressEditModalProps> = ({
  isOpen,
  onClose,
  data,
  onConfirm
}) => {
  const [formData, setFormData] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    postal_code: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && data?.address) {
      setFormData({
        address_line_1: data.address.address_line_1 || '',
        address_line_2: data.address.address_line_2 || '',
        city: data.address.city || '',
        postal_code: data.address.postal_code || ''
      })
    } else if (isOpen && !data?.addressId) {
      // Reset form for new address
      setFormData({
        address_line_1: '',
        address_line_2: '',
        city: '',
        postal_code: ''
      })
    }
  }, [isOpen, data?.address, data?.addressId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.address_line_1.trim() || !formData.city.trim() || !formData.postal_code.trim()) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      const url = data?.addressId 
        ? `/api/customer/addresses/${data.addressId}` 
        : '/api/customer/addresses'
      
      const method = data?.addressId ? 'PUT' : 'POST'

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
        setError(result.error?.message || 'Failed to save address')
      }
    } catch (error) {
      setError('Network error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!data?.addressId) return
    
    if (!confirm('Are you sure you want to delete this address? This action cannot be undone.')) {
      return
    }

    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/customer/addresses/${data.addressId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        if (onConfirm) {
          await onConfirm({ deleted: true })
        }
        onClose()
      } else {
        setError(result.error?.message || 'Failed to delete address')
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
      title={data?.addressId ? "Edit Address" : "Add Address"}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Address Line 1 *
          </label>
          <Input
            value={formData.address_line_1}
            onChange={(e) => setFormData(prev => ({ ...prev, address_line_1: e.target.value }))}
            placeholder="e.g. 123 Main Street"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">
            Address Line 2
          </label>
          <Input
            value={formData.address_line_2}
            onChange={(e) => setFormData(prev => ({ ...prev, address_line_2: e.target.value }))}
            placeholder="e.g. Apartment 4B, Building Name"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              City *
            </label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="e.g. London"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Postal Code *
            </label>
            <Input
              value={formData.postal_code}
              onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value.toUpperCase() }))}
              placeholder="e.g. SW1A 1AA"
              required
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-border-secondary">
          {data?.addressId && (
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
            disabled={isSubmitting}
            leftIcon={<MapPin className="w-4 h-4" />}
          >
            {isSubmitting ? 'Saving...' : data?.addressId ? 'Update Address' : 'Add Address'}
          </Button>
        </div>
      </form>
    </BaseModal>
  )
}