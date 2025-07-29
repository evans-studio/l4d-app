'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { 
  PlusIcon,
  EditIcon,
  SearchIcon,
  PackageIcon,
  ArrowLeftIcon,
  DollarSignIcon,
  TagIcon,
  CarIcon
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string
  category: string
  base_price: number
  duration_minutes: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ServiceCategory {
  id: string
  name: string
  description: string
  sort_order: number
}

function AdminServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch services
        const servicesResponse = await fetch('/api/services')
        const servicesData = await servicesResponse.json()
        
        if (servicesData.success) {
          setServices(servicesData.data || [])
        }

        // Fetch categories
        const categoriesResponse = await fetch('/api/services/categories')
        const categoriesData = await categoriesResponse.json()
        
        if (categoriesData.success) {
          setCategories(categoriesData.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch services data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredServices = services.filter(service => {
    // Search filter
    if (searchTerm && !service.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !service.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Category filter
    if (categoryFilter !== 'all' && service.category !== categoryFilter) {
      return false
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active' && !service.is_active) return false
      if (statusFilter === 'inactive' && service.is_active) return false
    }

    return true
  })

  const toggleServiceStatus = async (serviceId: string, newStatus: boolean) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus })
      })

      if (response.ok) {
        setServices(prev => prev.map(service => 
          service.id === serviceId 
            ? { ...service, is_active: newStatus }
            : service
        ))
      }
    } catch (error) {
      console.error('Failed to update service status:', error)
    }
  }

  const formatPrice = (price: number) => `£${price.toFixed(2)}`
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Service Management
            </h1>
            <p className="text-[var(--text-secondary)]">
              Manage your detailing services and pricing
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <Button
              onClick={() => router.push('/admin')}
              variant="outline"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button
              onClick={() => router.push('/admin/services/categories')}
              variant="outline"
            >
              <TagIcon className="w-4 h-4 mr-2" />
              Manage Categories
            </Button>
            <Button
              onClick={() => router.push('/admin/services/pricing')}
              variant="outline"
            >
              <DollarSignIcon className="w-4 h-4 mr-2" />
              Pricing Management
            </Button>
            <Button
              onClick={() => router.push('/admin/services/vehicle-sizes')}
              variant="outline"
            >
              <CarIcon className="w-4 h-4 mr-2" />
              Vehicle Sizes
            </Button>
            <Button
              onClick={() => router.push('/admin/services/new')}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--surface-secondary)] rounded-lg p-6 mb-8 border border-[var(--border-secondary)]">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-[var(--border-secondary)]">
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)] mb-1">Total Services</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{services.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)] mb-1">Active</p>
              <p className="text-lg font-bold text-[var(--success)]">{services.filter(s => s.is_active).length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)] mb-1">Inactive</p>
              <p className="text-lg font-bold text-[var(--warning)]">{services.filter(s => !s.is_active).length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)] mb-1">Categories</p>
              <p className="text-lg font-bold text-[var(--text-primary)]">{categories.length}</p>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-[var(--surface-secondary)] rounded-lg p-8 max-w-md mx-auto">
              <PackageIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                No Services Found
              </h3>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
                  ? 'No services match your current filters.'
                  : 'Start by adding your first service.'
                }
              </p>
              {(!searchTerm && categoryFilter === 'all' && statusFilter === 'all') && (
                <Button
                  onClick={() => router.push('/admin/services/new')}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Your First Service
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)] hover:border-[var(--border-primary)] transition-colors"
              >
                {/* Service Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      service.is_active 
                        ? 'bg-[var(--success-bg)] text-[var(--success)]' 
                        : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                    }`}>
                      <PackageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">{service.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          service.is_active 
                            ? 'bg-[var(--success-bg)] text-[var(--success)]' 
                            : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                        }`}>
                          {service.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {service.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[var(--surface-tertiary)] text-[var(--text-secondary)]">
                            <TagIcon className="w-3 h-3 mr-1" />
                            {service.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-3 mb-4">
                  <p className="text-[var(--text-secondary)] text-sm line-clamp-2">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-[var(--text-primary)]">
                      <DollarSignIcon className="w-4 h-4 text-[var(--primary)]" />
                      <span className="font-semibold">{formatPrice(service.base_price)}</span>
                    </div>
                    <div className="text-[var(--text-secondary)]">
                      {formatDuration(service.duration_minutes)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[var(--border-secondary)]">
                  <Button
                    onClick={() => router.push(`/admin/services/${service.id}`)}
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center gap-2"
                  >
                    <EditIcon className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => toggleServiceStatus(service.id, !service.is_active)}
                    variant={service.is_active ? "outline" : "primary"}
                    size="sm"
                    className="flex-1"
                  >
                    {service.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default function AdminServicesPageWithProtection() {
  return (
    <AdminRoute>
      <AdminServicesPage />
    </AdminRoute>
  )
}