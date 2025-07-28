'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { Container } from '@/components/layout/templates/PageLayout'
import { CustomerRoute } from '@/components/TempProtectedRoute'
import { 
  MapPin, 
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Search,
  Home,
  Building2,
  Star
} from 'lucide-react'

interface Address {
  id: string
  label: string
  address_line_1: string
  address_line_2?: string
  city: string
  county?: string
  postal_code: string
  country: string
  is_primary: boolean
  notes?: string
  created_at: string
  updated_at: string
  _count?: {
    bookings: number
  }
}

const addressTypeIcons = {
  'Home': Home,
  'Work': Building2,
  'Office': Building2,
  'Other': MapPin
}

export default function MyAddressesPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; address: Address | null }>({
    isOpen: false,
    address: null
  })

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await fetch('/api/customer/addresses')
        const data = await response.json()
        
        if (data.success) {
          setAddresses(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch addresses:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAddresses()
  }, [])

  const handleDeleteAddress = async (addressId: string) => {
    try {
      const response = await fetch(`/api/customer/addresses/${addressId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAddresses(prev => prev.filter(a => a.id !== addressId))
        setDeleteModal({ isOpen: false, address: null })
      } else {
        alert('Failed to delete address. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting address:', error)
      alert('Failed to delete address. Please try again.')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      const response = await fetch(`/api/customer/addresses/${addressId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_primary: true })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update all addresses - set the selected one as default, others as not default
        setAddresses(prev => prev.map(addr => ({
          ...addr,
          is_primary: addr.id === addressId
        })))
      } else {
        alert('Failed to set default address. Please try again.')
      }
    } catch (error) {
      console.error('Error setting default address:', error)
      alert('Failed to set default address. Please try again.')
    }
  }

  const getFilteredAddresses = () => {
    if (!searchTerm) return addresses
    
    return addresses.filter(address =>
      address.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      address.address_line_1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      address.postal_code.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredAddresses = getFilteredAddresses()
  const defaultAddress = addresses.find(addr => addr.is_primary)

  if (isLoading) {
    return (
      <CustomerRoute>
        <CustomerLayout>
          <Container>
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
            </div>
          </Container>
        </CustomerLayout>
      </CustomerRoute>
    )
  }

  return (
    <CustomerRoute>
      <CustomerLayout>
        <Container>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                My Addresses
              </h1>
              <p className="text-text-secondary">
                Manage your saved addresses for faster booking
              </p>
            </div>
            
            <Button
              variant="primary"
              onClick={() => router.push('/dashboard/addresses/add')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Address
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
            />
          </div>

          {/* Default Address Highlight */}
          {defaultAddress && !searchTerm && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-brand-400" />
                Default Address
              </h2>
              <div className="bg-brand-600/10 border border-brand-500/20 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const IconComponent = addressTypeIcons[defaultAddress.label as keyof typeof addressTypeIcons] || MapPin
                      return <IconComponent className="w-5 h-5 text-brand-400 mt-1" />
                    })()}
                    <div>
                      <h3 className="font-semibold text-text-primary mb-1">
                        {defaultAddress.label}
                      </h3>
                      <p className="text-text-secondary text-sm">
                        {defaultAddress.address_line_1}
                        {defaultAddress.address_line_2 && `, ${defaultAddress.address_line_2}`}
                      </p>
                      <p className="text-text-secondary text-sm">
                        {defaultAddress.city}, {defaultAddress.postal_code}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/dashboard/addresses/${defaultAddress.id}/edit`)}
                    leftIcon={<Edit className="w-4 h-4" />}
                  >
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Addresses List */}
          {filteredAddresses.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-surface-secondary rounded-lg p-8 max-w-md mx-auto">
                <MapPin className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {searchTerm ? 'No addresses found' : 'No addresses saved'}
                </h3>
                <p className="text-text-secondary text-sm mb-6">
                  {searchTerm ? 'Try adjusting your search terms.' :
                   'Add your addresses to make booking faster and easier. Your address details will be saved for future appointments.'}
                </p>
                {!searchTerm && (
                  <Button
                    variant="primary"
                    onClick={() => router.push('/dashboard/addresses/add')}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Your First Address
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-primary">
                {searchTerm ? 'Search Results' : 'All Addresses'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredAddresses.map((address) => {
                  const IconComponent = addressTypeIcons[address.label as keyof typeof addressTypeIcons] || MapPin
                  
                  return (
                    <div
                      key={address.id}
                      className={`bg-surface-secondary rounded-lg p-6 border transition-colors ${
                        address.is_primary 
                          ? 'border-brand-500/50 bg-brand-600/5' 
                          : 'border-border-secondary hover:border-border-primary'
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-5 h-5 text-brand-400" />
                          <h3 className="font-semibold text-text-primary">
                            {address.label}
                          </h3>
                          {address.is_primary && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-brand-600/10 border border-brand-500/20 rounded-full text-xs text-brand-400">
                              <Star className="w-3 h-3" />
                              Default
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/addresses/${address.id}/edit`)}
                            leftIcon={<Edit className="w-4 h-4" />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteModal({ isOpen: true, address })}
                            leftIcon={<Trash2 className="w-4 h-4" />}
                            className="text-error-400 hover:text-error-300"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      {/* Address Details */}
                      <div className="space-y-2 mb-4">
                        <p className="text-text-primary">
                          {address.address_line_1}
                        </p>
                        {address.address_line_2 && (
                          <p className="text-text-secondary text-sm">
                            {address.address_line_2}
                          </p>
                        )}
                        <p className="text-text-secondary">
                          {address.city}
                          {address.county && `, ${address.county}`}
                        </p>
                        <p className="text-text-secondary">
                          {address.postal_code}, {address.country}
                        </p>
                      </div>

                      {/* Booking Count */}
                      {address._count && (
                        <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                          <Calendar className="w-4 h-4" />
                          <span>{address._count.bookings} booking{address._count.bookings !== 1 ? 's' : ''}</span>
                        </div>
                      )}

                      {address.notes && (
                        <div className="bg-surface-primary p-3 rounded-md mb-4">
                          <p className="text-text-secondary text-sm">
                            <strong>Notes:</strong> {address.notes}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {!address.is_primary && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefault(address.id)}
                            leftIcon={<Star className="w-4 h-4" />}
                          >
                            Set as Default
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/book?address=${address.id}`)}
                          className="flex-1"
                        >
                          Book Service Here
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteModal.isOpen && deleteModal.address && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-surface-secondary rounded-lg p-6 max-w-md mx-4 border border-border-secondary">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-error-600/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-error-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      Delete Address
                    </h3>
                    <p className="text-text-secondary text-sm">
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                <p className="text-text-secondary mb-6">
                  Are you sure you want to delete{' '}
                  <strong className="text-text-primary">
                    {deleteModal.address.label}
                  </strong>
                  ? This will not affect your existing bookings, but you'll need to re-enter address details for future bookings.
                  {deleteModal.address.is_primary && (
                    <span className="block mt-2 text-warning-400 text-sm">
                      <strong>Note:</strong> This is your default address. You may want to set another address as default first.
                    </span>
                  )}
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => setDeleteModal({ isOpen: false, address: null })}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleDeleteAddress(deleteModal.address!.id)}
                  >
                    Delete Address
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Container>
      </CustomerLayout>
    </CustomerRoute>
  )
}