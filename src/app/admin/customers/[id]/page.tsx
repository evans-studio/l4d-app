'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/primitives/Button'
import { 
  ArrowLeftIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  CalendarIcon,
  MapPinIcon,
  CarIcon,
  CreditCardIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react'

interface CustomerDetail {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  created_at: string
  updated_at: string
  role: string
  is_active: boolean
}

interface CustomerBooking {
  id: string
  booking_reference: string
  scheduled_date: string
  start_time: string
  status: string
  total_price: number
  services: Array<{
    name: string
    price: number
  }>
  vehicle?: {
    make: string
    model: string
    year?: number
  }
  address?: {
    address_line_1: string
    city: string
    postal_code: string
  }
}

interface CustomerAddress {
  id: string
  address_line_1: string
  address_line_2?: string
  city: string
  postal_code: string
  is_primary: boolean
}

interface CustomerVehicle {
  id: string
  make: string
  model: string
  year?: number
  color?: string
  license_plate?: string
  is_primary: boolean
}

function CustomerDetailContent({ customerId }: { customerId: string }) {
  const router = useRouter()
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [bookings, setBookings] = useState<CustomerBooking[]>([])
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadCustomerData()
  }, [customerId])

  const loadCustomerData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load customer profile
      const customerResponse = await fetch(`/api/admin/customers/${customerId}`)
      
      if (!customerResponse.ok) {
        throw new Error('Failed to load customer data')
      }

      const customerData = await customerResponse.json()
      
      if (customerData.success) {
        setCustomer(customerData.data.customer)
        setBookings(customerData.data.bookings || [])
        setAddresses(customerData.data.addresses || [])
        setVehicles(customerData.data.vehicles || [])
      } else {
        throw new Error(customerData.error?.message || 'Failed to load customer')
      }
    } catch (error) {
      console.error('Error loading customer data:', error)
      setError('Failed to load customer information')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon className="w-4 h-4 text-green-600" />
      case 'confirmed': return <CheckCircleIcon className="w-4 h-4 text-blue-600" />
      case 'cancelled': return <XCircleIcon className="w-4 h-4 text-red-600" />
      default: return <ClockIcon className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error || !customer) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            {error || 'Customer not found'}
          </h3>
          <Button onClick={() => router.push('/admin/customers')}>
            Back to Customers
          </Button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/customers')}
            leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
          >
            Back to Customers
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {customer.first_name} {customer.last_name}
            </h1>
            <p className="text-text-secondary">Customer Details</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Info */}
          <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <MailIcon className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary">{customer.email}</span>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-4 h-4 text-text-muted" />
                  <span className="text-text-primary">{customer.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary">Joined {formatDate(customer.created_at)}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  customer.is_active 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {customer.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Total Bookings</span>
                <span className="font-semibold text-text-primary">{bookings.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Total Spent</span>
                <span className="font-semibold text-text-primary">
                  £{bookings.reduce((sum, b) => sum + b.total_price, 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Vehicles</span>
                <span className="font-semibold text-text-primary">{vehicles.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary">Addresses</span>
                <span className="font-semibold text-text-primary">{addresses.length}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
            {bookings.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="text-text-secondary">Last Booking:</span>
                  <br />
                  <span className="text-text-primary">
                    {formatDate(bookings[0]?.scheduled_date)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-text-secondary">Status:</span>
                  <br />
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(bookings[0]?.status)}`}>
                    {getStatusIcon(bookings[0]?.status)}
                    {bookings[0]?.status}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-text-secondary text-sm">No bookings yet</p>
            )}
          </div>
        </div>

        {/* Bookings History */}
        <div className="bg-surface-secondary rounded-lg border border-border-primary">
          <div className="px-6 py-4 border-b border-border-secondary">
            <h3 className="text-lg font-semibold text-text-primary">Booking History</h3>
          </div>
          <div className="p-6">
            {bookings.length === 0 ? (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-secondary">No bookings found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-border-secondary rounded-lg p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-text-primary">
                            #{booking.booking_reference}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            {booking.status}
                          </span>
                        </div>
                        <div className="text-sm text-text-secondary space-y-1">
                          <div>{formatDate(booking.scheduled_date)} at {formatTime(booking.start_time)}</div>
                          <div>{booking.services.map(s => s.name).join(', ')}</div>
                          {booking.vehicle && (
                            <div>{booking.vehicle.year} {booking.vehicle.make} {booking.vehicle.model}</div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-text-primary">£{booking.total_price}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Vehicles & Addresses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vehicles */}
          <div className="bg-surface-secondary rounded-lg border border-border-primary">
            <div className="px-6 py-4 border-b border-border-secondary">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <CarIcon className="w-5 h-5" />
                Vehicles
              </h3>
            </div>
            <div className="p-6">
              {vehicles.length === 0 ? (
                <p className="text-text-secondary text-center py-4">No vehicles registered</p>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="border border-border-secondary rounded-lg p-3">
                      <div className="font-medium text-text-primary">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-sm text-text-secondary">
                        {vehicle.color && <span>Color: {vehicle.color}</span>}
                        {vehicle.license_plate && <span className="ml-4">Plate: {vehicle.license_plate}</span>}
                        {vehicle.is_primary && <span className="ml-4 text-brand-600">Primary</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-surface-secondary rounded-lg border border-border-primary">
            <div className="px-6 py-4 border-b border-border-secondary">
              <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                <MapPinIcon className="w-5 h-5" />
                Addresses
              </h3>
            </div>
            <div className="p-6">
              {addresses.length === 0 ? (
                <p className="text-text-secondary text-center py-4">No addresses registered</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div key={address.id} className="border border-border-secondary rounded-lg p-3">
                      <div className="font-medium text-text-primary">
                        {address.address_line_1}
                      </div>
                      {address.address_line_2 && (
                        <div className="text-sm text-text-secondary">{address.address_line_2}</div>
                      )}
                      <div className="text-sm text-text-secondary">
                        {address.city}, {address.postal_code}
                        {address.is_primary && <span className="ml-4 text-brand-600">Primary</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  return (
    <AdminRoute>
      <CustomerDetailContent customerId={params.id} />
    </AdminRoute>
  )
}