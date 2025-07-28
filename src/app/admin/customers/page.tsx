'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { Button } from '@/components/ui/primitives/Button'
import { 
  UsersIcon,
  SearchIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CarIcon,
  CalendarIcon,
  DollarSignIcon,
  TrendingUpIcon,
  EyeIcon,
  UserCheckIcon,
  DownloadIcon,
  RefreshCwIcon
} from 'lucide-react'

interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  created_at: string
  last_booking_date?: string
  total_bookings: number
  total_spent: number
  avg_booking_value: number
  status: 'active' | 'inactive' | 'vip'
  addresses: Array<{
    id: string
    address_line_1: string
    city: string
    postcode: string
    is_primary: boolean
  }>
  vehicles: Array<{
    id: string
    make: string
    model: string
    year?: number
    is_primary: boolean
  }>
  recent_services: Array<{
    name: string
    date: string
  }>
}

interface CustomerStats {
  total_customers: number
  active_customers: number
  new_this_month: number
  vip_customers: number
  avg_customer_value: number
  customer_retention_rate: number
}

const statusConfig = {
  active: {
    label: 'Active',
    color: 'text-green-700',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  inactive: {
    label: 'Inactive',
    color: 'text-gray-700',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  vip: {
    label: 'VIP',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  }
}

export default function AdminCustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'spent' | 'bookings'>('name')

  useEffect(() => {
    loadCustomerData()
  }, [])

  const loadCustomerData = async () => {
    try {
      setIsLoading(true)
      const [customersResponse, statsResponse] = await Promise.all([
        fetch('/api/admin/customers'),
        fetch('/api/admin/customers/stats')
      ])

      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        if (customersData.success) {
          setCustomers(customersData.data)
        }
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats(statsData.data)
        }
      }
    } catch (error) {
      console.error('Failed to load customer data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortCustomers = useCallback(() => {
    let filtered = customers

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        `${customer.first_name} ${customer.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        customer.addresses.some(addr => addr.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                       addr.postcode.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'spent':
          return b.total_spent - a.total_spent
        case 'bookings':
          return b.total_bookings - a.total_bookings
        default:
          return 0
      }
    })

    setFilteredCustomers(filtered)
  }, [customers, searchTerm, statusFilter, sortBy])

  useEffect(() => {
    filterAndSortCustomers()
  }, [filterAndSortCustomers])

  const exportCustomers = async () => {
    try {
      const response = await fetch('/api/admin/customers/export')
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig]
    if (!config) return null
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bgColor} ${config.borderColor} ${config.color}`}>
        {config.label}
      </span>
    )
  }

  const getDaysSinceLastBooking = (lastBookingDate?: string) => {
    if (!lastBookingDate) return 'Never'
    const days = Math.floor((Date.now() - new Date(lastBookingDate).getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return '1 day ago'
    if (days < 30) return `${days} days ago`
    if (days < 365) return `${Math.floor(days / 30)} months ago`
    return `${Math.floor(days / 365)} years ago`
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Customer Database</h1>
            <p className="text-text-secondary mt-2">
              Manage and analyze your customer relationships
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Button
              variant="outline"
              onClick={exportCustomers}
              className="flex items-center gap-2"
            >
              <DownloadIcon className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              onClick={loadCustomerData}
              className="flex items-center gap-2"
            >
              <RefreshCwIcon className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-surface-secondary rounded-lg border border-border-primary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Customers</p>
                  <p className="text-xl font-bold text-text-primary">{stats.total_customers}</p>
                </div>
                <UsersIcon className="w-6 h-6 text-brand-purple" />
              </div>
            </div>

            <div className="bg-surface-secondary rounded-lg border border-border-primary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Active</p>
                  <p className="text-xl font-bold text-green-600">{stats.active_customers}</p>
                </div>
                <UserCheckIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-surface-secondary rounded-lg border border-border-primary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">New This Month</p>
                  <p className="text-xl font-bold text-blue-600">{stats.new_this_month}</p>
                </div>
                <TrendingUpIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-surface-secondary rounded-lg border border-border-primary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">VIP Customers</p>
                  <p className="text-xl font-bold text-purple-600">{stats.vip_customers}</p>
                </div>
                <UserCheckIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>

            <div className="bg-surface-secondary rounded-lg border border-border-primary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Avg. Value</p>
                  <p className="text-xl font-bold text-text-primary">£{stats.avg_customer_value}</p>
                </div>
                <DollarSignIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-surface-secondary rounded-lg border border-border-primary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Retention</p>
                  <p className="text-xl font-bold text-text-primary">{stats.customer_retention_rate}%</p>
                </div>
                <TrendingUpIcon className="w-6 h-6 text-brand-purple" />
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search customers by name, email, phone, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'spent' | 'bookings')}
                className="px-4 py-2 bg-surface-primary border border-border-secondary rounded-md text-text-primary focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              >
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
                <option value="spent">Sort by Spent</option>
                <option value="bookings">Sort by Bookings</option>
              </select>
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-surface-secondary rounded-lg border border-border-primary">
          <div className="overflow-x-auto">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">No Customers Found</h3>
                <p className="text-text-secondary">No customers match your current filters.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="p-6 border-b border-border-secondary last:border-b-0 hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Customer Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-text-primary">
                              {customer.first_name} {customer.last_name}
                            </h3>
                            <div className="flex items-center gap-3 mt-1">
                              {getStatusBadge(customer.status)}
                              <span className="text-text-muted text-sm">
                                Member since {formatDate(customer.created_at)}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-brand-purple">£{customer.total_spent}</p>
                            <p className="text-text-muted text-sm">{customer.total_bookings} bookings</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Contact */}
                          <div className="space-y-2">
                            <p className="text-text-secondary text-xs font-medium">Contact</p>
                            <div className="flex items-center gap-2">
                              <MailIcon className="w-4 h-4 text-text-secondary" />
                              <span className="text-text-primary text-sm truncate">{customer.email}</span>
                            </div>
                            {customer.phone && (
                              <div className="flex items-center gap-2">
                                <PhoneIcon className="w-4 h-4 text-text-secondary" />
                                <span className="text-text-primary text-sm">{customer.phone}</span>
                              </div>
                            )}
                          </div>

                          {/* Location */}
                          <div className="space-y-2">
                            <p className="text-text-secondary text-xs font-medium">Primary Address</p>
                            {customer.addresses.length > 0 && customer.addresses[0] ? (
                              <div className="flex items-center gap-2">
                                <MapPinIcon className="w-4 h-4 text-text-secondary" />
                                <span className="text-text-primary text-sm">
                                  {customer.addresses[0].city}, {customer.addresses[0].postcode}
                                </span>
                              </div>
                            ) : (
                              <span className="text-text-muted text-sm">No address</span>
                            )}
                            <p className="text-text-muted text-xs">
                              {customer.addresses.length} address{customer.addresses.length !== 1 ? 'es' : ''}
                            </p>
                          </div>

                          {/* Vehicles */}
                          <div className="space-y-2">
                            <p className="text-text-secondary text-xs font-medium">Vehicles</p>
                            {customer.vehicles.length > 0 && customer.vehicles[0] ? (
                              <div className="flex items-center gap-2">
                                <CarIcon className="w-4 h-4 text-text-secondary" />
                                <span className="text-text-primary text-sm">
                                  {customer.vehicles[0].year} {customer.vehicles[0].make} {customer.vehicles[0].model}
                                </span>
                              </div>
                            ) : (
                              <span className="text-text-muted text-sm">No vehicles</span>
                            )}
                            <p className="text-text-muted text-xs">
                              {customer.vehicles.length} vehicle{customer.vehicles.length !== 1 ? 's' : ''}
                            </p>
                          </div>

                          {/* Activity */}
                          <div className="space-y-2">
                            <p className="text-text-secondary text-xs font-medium">Activity</p>
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4 text-text-secondary" />
                              <span className="text-text-primary text-sm">
                                {getDaysSinceLastBooking(customer.last_booking_date)}
                              </span>
                            </div>
                            <p className="text-text-muted text-xs">
                              Avg. £{customer.avg_booking_value} per booking
                            </p>
                          </div>
                        </div>

                        {/* Recent Services */}
                        {customer.recent_services.length > 0 && (
                          <div className="mt-3">
                            <p className="text-text-secondary text-xs font-medium mb-2">Recent Services</p>
                            <div className="flex flex-wrap gap-1">
                              {customer.recent_services.slice(0, 3).map((service, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-surface-primary rounded text-xs text-text-primary"
                                >
                                  {service.name}
                                </span>
                              ))}
                              {customer.recent_services.length > 3 && (
                                <span className="px-2 py-1 bg-surface-primary rounded text-xs text-text-muted">
                                  +{customer.recent_services.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/admin/customers/${customer.id}`)}
                          className="flex items-center gap-2"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View Details
                        </Button>
                        <div className="flex gap-2">
                          <a
                            href={`tel:${customer.phone}`}
                            className="flex-1 flex items-center justify-center p-2 border border-border-secondary rounded hover:bg-surface-hover transition-colors"
                          >
                            <PhoneIcon className="w-4 h-4 text-text-secondary" />
                          </a>
                          <a
                            href={`mailto:${customer.email}`}
                            className="flex-1 flex items-center justify-center p-2 border border-border-secondary rounded hover:bg-surface-hover transition-colors"
                          >
                            <MailIcon className="w-4 h-4 text-text-secondary" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}