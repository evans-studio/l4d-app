'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { AddressCard } from '@/components/customer/components/AddressCard'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { CustomerRoute } from '@/components/ProtectedRoute'
import { Plus, MapPin, AlertCircle } from 'lucide-react'
import { useOverlay } from '@/lib/overlay/context'

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
  const { openOverlay } = useOverlay()

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
  
  // Deletion overlay local state
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
    openOverlay({
      type: 'address-create',
      data: {},
      onConfirm: async () => {
        await fetchAddresses()
      }
    })
  }

  const handleEditAddress = (address: Address) => {
    openOverlay({
      type: 'address-edit',
      data: { addressId: address.id, address },
      onConfirm: async () => {
        await fetchAddresses()
      }
    })
  }

  // Submission handled in overlay components; keep helper for default toggle

  const handleDeleteAddress = (addressId: string) => {
    const address = addresses.find(a => a.id === addressId)
    if (address) {
      setAddressToDelete(address)
      openOverlay({
        type: 'confirm-delete',
        data: {
          title: 'Delete Address',
          message: `Are you sure you want to delete the address at ${address.address_line_1}, ${address.city}? This action cannot be undone.`,
          confirmText: 'Delete Address',
          itemName: 'address'
        },
        onConfirm: async () => {
          await confirmDeleteAddress()
        }
      })
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
          <Button onClick={handleAddAddress} className="sm:w-auto w-full">Add Address</Button>
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

        {/* Add/Edit handled by overlays */}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No addresses yet</h3>
              <p className="text-text-secondary mb-6">
                Add your first service address to get started with faster bookings and automatic travel surcharge calculation
              </p>
              <Button onClick={handleAddAddress}>Add Your First Address</Button>
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

        {/* Deletion handled by overlay */}
      </CustomerLayout>
    </CustomerRoute>
  )
}