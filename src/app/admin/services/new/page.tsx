'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { 
  ArrowLeftIcon,
  SaveIcon,
  PackageIcon,
  DollarSignIcon,
  ClockIcon,
  TagIcon,
  AlertCircleIcon
} from 'lucide-react'

interface ServiceCategory {
  id: string
  name: string
  description: string
  display_order: number
}

interface VehicleSize {
  id: string
  name: string
  display_order: number
}

interface ServiceFormData {
  name: string
  short_description: string
  long_description: string
  category_id: string
  estimated_duration: number
  is_active: boolean
  display_order: number
  pricing: {
    [vehicleSizeId: string]: number
  }
}

function NewServicePage() {
  const router = useRouter()
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [vehicleSizes, setVehicleSizes] = useState<VehicleSize[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    short_description: '',
    long_description: '',
    category_id: '',
    estimated_duration: 60,
    is_active: true,
    display_order: 0,
    pricing: {}
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch categories and vehicle sizes in parallel
        const [categoriesResponse, vehicleSizesResponse] = await Promise.all([
          fetch('/api/services/categories'),
          fetch('/api/services/vehicle-sizes')
        ])

        const categoriesData = await categoriesResponse.json()
        const vehicleSizesData = await vehicleSizesResponse.json()
        
        if (categoriesData.success) {
          setCategories(categoriesData.data || [])
          // Set first category as default
          if (categoriesData.data?.length > 0) {
            setFormData(prev => ({ ...prev, category_id: categoriesData.data[0].id }))
          }
        }

        if (vehicleSizesData.success) {
          setVehicleSizes(vehicleSizesData.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required'
    }

    if (!formData.short_description.trim()) {
      newErrors.short_description = 'Short description is required'
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category'
    }

    if (formData.estimated_duration <= 0) {
      newErrors.estimated_duration = 'Duration must be greater than 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    try {
      // Create the service
      const serviceResponse = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          shortDescription: formData.short_description,
          longDescription: formData.long_description,
          categoryId: formData.category_id,
          estimatedDuration: formData.estimated_duration,
          isActive: formData.is_active,
          displayOrder: formData.display_order
        })
      })

      const serviceData = await serviceResponse.json()
      
      if (!serviceData.success) {
        setErrors({ submit: serviceData.error?.message || 'Failed to create service' })
        return
      }

      const newServiceId = serviceData.data.id

      // Save pricing if we have any
      if (Object.keys(formData.pricing).length > 0) {
        const pricingResponse = await fetch('/api/admin/services/pricing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: newServiceId,
            pricing: formData.pricing
          })
        })

        const pricingData = await pricingResponse.json()
        if (!pricingData.success) {
          console.warn('Service created but pricing failed to save:', pricingData.error?.message)
        }
      }
      
      router.push('/admin/services')
    } catch (error) {
      console.error('Failed to create service:', error)
      setErrors({ submit: 'Failed to create service. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof ServiceFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`
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
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Create New Service
            </h1>
            <p className="text-[var(--text-secondary)]">
              Add a new detailing service with custom pricing
            </p>
          </div>
          
          <Button
            onClick={() => router.push('/admin/services')}
            variant="outline"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Services
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                  <PackageIcon className="w-5 h-5" />
                  Basic Information
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Service Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="e.g., Premium Exterior Wash"
                      className={`w-full px-4 py-3 bg-[var(--input-bg)] border rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none transition-colors ${
                        errors.name ? 'border-[var(--error)]' : 'border-[var(--input-border)] focus:border-[var(--input-border-focus)]'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-[var(--error)] text-sm mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Short Description *
                    </label>
                    <input
                      type="text"
                      value={formData.short_description}
                      onChange={(e) => handleInputChange('short_description', e.target.value)}
                      placeholder="Brief description for listings"
                      className={`w-full px-4 py-3 bg-[var(--input-bg)] border rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:outline-none transition-colors ${
                        errors.short_description ? 'border-[var(--error)]' : 'border-[var(--input-border)] focus:border-[var(--input-border-focus)]'
                      }`}
                    />
                    {errors.short_description && (
                      <p className="text-[var(--error)] text-sm mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />
                        {errors.short_description}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Detailed Description
                    </label>
                    <textarea
                      value={formData.long_description}
                      onChange={(e) => handleInputChange('long_description', e.target.value)}
                      placeholder="Detailed description of what's included in this service..."
                      rows={4}
                      className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing & Duration */}
              <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                  <DollarSignIcon className="w-5 h-5" />
                  Pricing & Duration
                </h2>

                <div className="space-y-6">
                  {/* Vehicle Size Pricing */}
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-4">
                      Vehicle Size Pricing (£)
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vehicleSizes.map((vehicleSize) => (
                        <div key={vehicleSize.id}>
                          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                            {vehicleSize.name}
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]">£</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.pricing[vehicleSize.id] || ''}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value) || 0
                                setFormData(prev => ({
                                  ...prev,
                                  pricing: {
                                    ...prev.pricing,
                                    [vehicleSize.id]: value
                                  }
                                }))
                              }}
                              placeholder="0.00"
                              className="w-full pl-8 pr-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[var(--text-muted)] text-xs mt-2">
                      Set individual prices for each vehicle size (optional)
                    </p>
                  </div>

                  {/* Duration */}
                  <div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                        Estimated Duration (minutes) *
                      </label>
                      <div className="relative">
                        <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                        <input
                          type="number"
                          min="1"
                          value={formData.estimated_duration}
                          onChange={(e) => handleInputChange('estimated_duration', parseInt(e.target.value) || 0)}
                          className={`w-full pl-10 pr-4 py-3 bg-[var(--input-bg)] border rounded-md text-[var(--input-text)] focus:outline-none transition-colors ${
                            errors.estimated_duration ? 'border-[var(--error)]' : 'border-[var(--input-border)] focus:border-[var(--input-border-focus)]'
                          }`}
                        />
                      </div>
                      {errors.estimated_duration && (
                        <p className="text-[var(--error)] text-sm mt-1 flex items-center gap-1">
                          <AlertCircleIcon className="w-4 h-4" />
                          {errors.estimated_duration}
                        </p>
                      )}
                      <p className="text-[var(--text-muted)] text-xs mt-1">
                        {formatDuration(formData.estimated_duration)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category & Settings */}
              <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                  <TagIcon className="w-5 h-5" />
                  Category & Settings
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Category *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => handleInputChange('category_id', e.target.value)}
                      className={`w-full px-4 py-3 bg-[var(--input-bg)] border rounded-md text-[var(--input-text)] focus:outline-none transition-colors ${
                        errors.category_id ? 'border-[var(--error)]' : 'border-[var(--input-border)] focus:border-[var(--input-border-focus)]'
                      }`}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category_id && (
                      <p className="text-[var(--error)] text-sm mt-1 flex items-center gap-1">
                        <AlertCircleIcon className="w-4 h-4" />
                        {errors.category_id}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      Display Order
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.display_order}
                      onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                    />
                    <p className="text-[var(--text-muted)] text-xs mt-1">
                      Lower numbers appear first
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => handleInputChange('is_active', e.target.checked)}
                      className="w-4 h-4 text-[var(--primary)] border border-[var(--input-border)] rounded focus:ring-[var(--primary)]"
                    />
                    <span className="text-sm text-[var(--text-primary)]">
                      Active (available for booking)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="space-y-6">
              <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)] sticky top-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
                  Service Preview
                </h3>
                
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border-2 transition-colors ${
                    formData.is_active 
                      ? 'bg-[var(--success-bg)] border-[var(--success)]' 
                      : 'bg-[var(--warning-bg)] border-[var(--warning)]'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <PackageIcon className="w-4 h-4" />
                      <span className="font-medium">
                        {formData.name || 'Service Name'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      {formData.short_description || 'Brief description will appear here'}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <DollarSignIcon className="w-4 h-4" />
                        <div className="text-xs">
                          {Object.keys(formData.pricing).length > 0 ? (
                            <div className="space-y-1">
                              {vehicleSizes.map(size => (
                                <div key={size.id} className="flex justify-between">
                                  <span className="text-[var(--text-muted)]">{size.name}:</span>
                                  <span className="font-semibold">
                                    £{(formData.pricing[size.id] || 0).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[var(--text-muted)] text-xs">No pricing set</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{formatDuration(formData.estimated_duration)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-[var(--text-muted)] space-y-1">
                    <p>• {Object.keys(formData.pricing).length > 0 ? 'Individual pricing set per vehicle size' : 'No pricing configured yet'}</p>
                    <p>• Duration is estimated</p>
                    <p>• {formData.is_active ? 'Available for booking' : 'Hidden from customers'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-6 border-t border-[var(--border-secondary)]">
            {errors.submit && (
              <p className="text-[var(--error)] text-sm flex items-center gap-1">
                <AlertCircleIcon className="w-4 h-4" />
                {errors.submit}
              </p>
            )}
            
            <div className="flex items-center gap-3 ml-auto">
              <Button
                type="button"
                onClick={() => router.push('/admin/services')}
                variant="outline"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4" />
                    Create Service
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

export default function NewServicePageWithProtection() {
  return (
    <AdminRoute>
      <NewServicePage />
    </AdminRoute>
  )
}