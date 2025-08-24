'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { AdminRoute } from '@/components/ProtectedRoute'
import { 
  PlusIcon,
  EditIcon,
  PackageIcon,
  DollarSignIcon,
  TagIcon
} from 'lucide-react'

interface Service {
  id: string
  name: string
  description?: string
  short_description?: string
  category: {
    id: string
    name: string
    is_active: boolean
    created_at: string
    description: string
    display_order: number
  } | null
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

interface VehicleSize {
  id: string
  name: string
  display_order: number
}

interface ServicePricing {
  [serviceId: string]: {
    [vehicleSizeId: string]: {
      service_id: string
      vehicle_size_id: string
      price: number
    }
  }
}

function AdminServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [vehicleSizes, setVehicleSizes] = useState<VehicleSize[]>([])
  const [pricing, setPricing] = useState<ServicePricing>({})
  const [isLoading, setIsLoading] = useState(true)
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch services, categories, vehicle sizes, and pricing in parallel
        const [servicesResponse, categoriesResponse, vehicleSizesResponse, pricingResponse] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/services/categories'),
          fetch('/api/services/vehicle-sizes'),
          fetch('/api/admin/services/pricing')
        ])

        const servicesData = await servicesResponse.json()
        const categoriesData = await categoriesResponse.json()
        const vehicleSizesData = await vehicleSizesResponse.json()
        const pricingData = await pricingResponse.json()
        
        if (servicesData.success) {
          setServices(servicesData.data || [])
        }

        if (categoriesData.success) {
          setCategories(categoriesData.data || [])
        }

        if (vehicleSizesData.success) {
          setVehicleSizes(vehicleSizesData.data || [])
        }

        if (pricingData.success) {
          setPricing(pricingData.data || {})
        }
      } catch (error) {
        console.error('Failed to fetch services data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const filteredServices = services

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Services</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-3">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Service Management
            </h1>
            <p className="text-[var(--text-secondary)]">
              Manage your detailing services and pricing
            </p>
          </div>
          
          <div className="w-full sm:w-auto mt-4 sm:mt-0">
            <Button
              onClick={() => router.push('/admin/services/new')}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <PlusIcon className="w-4 h-4" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Filters removed as requested */}

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-[var(--surface-secondary)] rounded-lg p-8 max-w-md mx-auto">
              <PackageIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                No Services Found
              </h3>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                Start by adding your first service.
              </p>
              {
                <Button
                  onClick={() => router.push('/admin/services/new')}
                  className="flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Your First Service
                </Button>
              }
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="bg-[var(--surface-secondary)] rounded-lg p-4 sm:p-6 border border-[var(--border-secondary)] hover:border-[var(--border-primary)] transition-colors"
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
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[var(--text-primary)] truncate max-w-[220px] sm:max-w-none">{service.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                            {service.category.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-3 mb-4">
                  <p className="text-[var(--text-secondary)] text-sm line-clamp-3">
                    {service.description || service.short_description || 'No description available'}
                  </p>
                  
                  <div className="flex items-start justify-between text-sm gap-3">
                    <div className="flex items-start gap-2 text-[var(--text-primary)] overflow-hidden">
                      <DollarSignIcon className="w-4 h-4 text-[var(--primary)]" />
                      <div className="text-xs">
                        {pricing[service.id] && vehicleSizes.length > 0 ? (
                          <div className="space-y-0.5">
                            {vehicleSizes.slice(0, 2).map(size => (
                              <div key={size.id} className="flex justify-between min-w-0 gap-2">
                                <span className="text-[var(--text-muted)]">{size.name}:</span>
                                <span className="font-semibold">
                                  £{(pricing[service.id]?.[size.id]?.price || 0).toFixed(2)}
                                </span>
                              </div>
                            ))}
                            {vehicleSizes.length > 2 && (
                              <div className="text-[var(--text-muted)] text-xs">
                                +{vehicleSizes.length - 2} more sizes
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)] text-xs">No pricing set</span>
                        )}
                      </div>
                    </div>
                    <div className="text-[var(--text-secondary)] whitespace-nowrap flex-shrink-0">
                      {formatDuration(service.duration_minutes)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-[var(--border-secondary)]">
                  <Button
                    onClick={() => router.push(`/admin/services/${service.id}`)}
                    variant="outline"
                    size="md"
                    className="w-full sm:flex-1 flex items-center justify-center gap-2 min-h-[44px] touch-manipulation"
                  >
                    <EditIcon className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => toggleServiceStatus(service.id, !service.is_active)}
                    variant={service.is_active ? "outline" : "primary"}
                    size="md"
                    className="w-full sm:flex-1 min-h-[44px] touch-manipulation"
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