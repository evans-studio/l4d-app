'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { AddressCard } from '@/components/customer/components/AddressCard'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { CustomerRoute } from '@/components/ProtectedRoute'
import { Plus, MapPin, AlertCircle } from 'lucide-react'
import { ConfirmationModal } from '@/components/ui/composites/ConfirmationModal'

interface Address {
  id: string
  address_line_1: string
  address_line_2?: string
  city: string
  county?: string
  postal_code: string
  country: string
  distance_from_business?: number
  is_primary: boolean
  is_default: boolean
  last_used?: string
  booking_count: number
  created_at: string
  updated_at: string
}

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)

  // Add/Edit form state
  const [formData, setFormData] = useState({
    address_line_1: '',
    address_line_2: '',
    city: '',
    county: '',
    postal_code: '',
    country: 'United Kingdom',
    set_as_default: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState<Address | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch addresses
  useEffect(() => {
    fetchAddresses().finally(() => setIsLoading(false))
  }, [])

  const fetchAddresses = async () => {
    try {
      const response = await fetch('/api/customer/addresses')
      const result = await response.json()
      
      if (result.success) {
        setAddresses(result.data)
      } else {
        setError(result.error?.message || 'Failed to fetch addresses')
      }
    } catch (err) {
      setError('Failed to load addresses')
    }
  }

  const handleAddAddress = () => {
    setEditingAddress(null)
    setFormData({
      address_line_1: '',
      address_line_2: '',
      city: '',
      county: '',
      postal_code: '',
      country: 'United Kingdom',
      set_as_default: addresses.length === 0
    })
    setShowAddForm(true)
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || '',
      city: address.city,
      county: address.county || '',
      postal_code: address.postal_code,
      country: address.country,
      set_as_default: address.is_default
    })
    setShowAddForm(true)
  }

  const handleSubmitAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingAddress 
        ? `/api/customer/addresses/${editingAddress.id}`
        : '/api/customer/addresses'
      
      const method = editingAddress ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchAddresses()
        setShowAddForm(false)
        setEditingAddress(null)
      } else {
        setError(result.error?.message || 'Failed to save address')
      }
    } catch (err) {
      setError('Failed to save address')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAddress = (addressId: string) => {
    const address = addresses.find(a => a.id === addressId)
    if (address) {
      setAddressToDelete(address)
      setShowDeleteConfirm(true)
    }
  }

  const confirmDeleteAddress = async () => {
    if (!addressToDelete) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/customer/addresses/${addressToDelete.id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchAddresses()
        setShowDeleteConfirm(false)
        setAddressToDelete(null)
      } else {
        setError(result.error?.message || 'Failed to delete address')
      }
    } catch (err) {
      setError('Failed to delete address')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      const address = addresses.find(a => a.id === addressId)
      if (!address) return

      const response = await fetch(`/api/customer/addresses/${addressId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          address_line_1: address.address_line_1,
          address_line_2: address.address_line_2,
          city: address.city,
          county: address.county,
          postal_code: address.postal_code,
          country: address.country,
          set_as_default: true
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchAddresses()
      } else {
        setError(result.error?.message || 'Failed to set default address')
      }
    } catch (err) {
      setError('Failed to set default address')
    }
  }

  const closeForm = () => {
    setShowAddForm(false)
    setEditingAddress(null)
    setError(null)
  }

  if (isLoading) {
    return (
      <CustomerRoute>
        <CustomerLayout>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
            </div>
          </div>
        </CustomerLayout>
      </CustomerRoute>
    )
  }

  return (
    <CustomerRoute>
      <CustomerLayout>
        <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">My Addresses</h1>
            <p className="text-text-secondary">
              Manage your service addresses with automatic distance calculation and travel surcharge information
            </p>
          </div>
          <Button
            onClick={handleAddAddress}
            leftIcon={<Plus className="w-5 h-5" />}
            className="sm:w-auto w-full"
          >
            Add Address
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-error-200 bg-error-600/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-error-400 flex-shrink-0" />
                <p className="text-error-600">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary">
                  {editingAddress ? 'Edit Address' : 'Add New Address'}
                </h2>
                <Button variant="ghost" size="sm" onClick={closeForm}>
                  ✕
                </Button>
              </div>

              <form onSubmit={handleSubmitAddress} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Address Line 1 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Address Line 1 *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address_line_1}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_line_1: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent text-text-primary"
                      placeholder="e.g., 123 Main Street"
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Address Line 2
                    </label>
                    <input
                      type="text"
                      value={formData.address_line_2}
                      onChange={(e) => setFormData(prev => ({ ...prev, address_line_2: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent text-text-primary"
                      placeholder="e.g., Apartment 4B, Building Name"
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent text-text-primary"
                      placeholder="e.g., London"
                    />
                  </div>

                  {/* County */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      County
                    </label>
                    <input
                      type="text"
                      value={formData.county}
                      onChange={(e) => setFormData(prev => ({ ...prev, county: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent text-text-primary"
                      placeholder="e.g., Greater London"
                    />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postal_code}
                      onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent text-text-primary font-mono"
                      placeholder="e.g., SW1A 1AA"
                    />
                    <p className="text-xs text-text-muted mt-1">
                      Used to calculate distance and travel surcharge automatically
                    </p>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Country
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:ring-2 focus:ring-brand-400 focus:border-transparent text-text-primary"
                    >
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="England">England</option>
                      <option value="Scotland">Scotland</option>
                      <option value="Wales">Wales</option>
                      <option value="Northern Ireland">Northern Ireland</option>
                    </select>
                  </div>
                </div>

                {/* Set as Default */}
                {!editingAddress && addresses.length > 0 && (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="set_as_default"
                      checked={formData.set_as_default}
                      onChange={(e) => setFormData(prev => ({ ...prev, set_as_default: e.target.checked }))}
                      className="w-4 h-4 text-brand-400 bg-surface-secondary border-surface-tertiary rounded focus:ring-brand-400"
                    />
                    <label htmlFor="set_as_default" className="text-sm text-text-primary">
                      Set as default address for bookings
                    </label>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                    className="sm:w-auto w-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    leftIcon={isSubmitting ? 
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> :
                      <MapPin className="w-4 h-4" />
                    }
                    className="sm:w-auto w-full"
                  >
                    {isSubmitting 
                      ? (editingAddress ? 'Updating...' : 'Adding...') 
                      : (editingAddress ? 'Update Address' : 'Add Address')
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No addresses yet</h3>
              <p className="text-text-secondary mb-6">
                Add your first service address to get started with faster bookings and automatic travel surcharge calculation
              </p>
              <Button onClick={handleAddAddress} leftIcon={<Plus className="w-5 h-5" />}>
                Add Your First Address
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {addresses.map(address => (
              <AddressCard
                key={address.id}
                address={address}
                variant="detailed"
                onEdit={handleEditAddress}
                onDelete={handleDeleteAddress}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}

        {/* Service Area Info */}
        <Card className="bg-brand-600/10 border-brand-200">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-3">Service Area Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-text-primary mb-2">Free Service Area</h4>
                <p className="text-text-secondary">
                  Within 17.5 miles of our business location (SW9). No additional travel charges apply.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-text-primary mb-2">Travel Surcharge Area</h4>
                <p className="text-text-secondary">
                  Beyond 17.5 miles: £0.50 per mile surcharge applies. Minimum £5, maximum £25 per booking.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false)
            setAddressToDelete(null)
          }}
          onConfirm={confirmDeleteAddress}
          title="Delete Address"
          message={
            addressToDelete
              ? `Are you sure you want to delete the address at ${addressToDelete.address_line_1}, ${addressToDelete.city}? This action cannot be undone.`
              : 'Are you sure you want to delete this address?'
          }
          confirmText="Delete Address"
          confirmVariant="danger"
          isLoading={isDeleting}
        />
      </CustomerLayout>
    </CustomerRoute>
  )
}