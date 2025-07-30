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
  AlertCircleIcon,
  TrashIcon
} from 'lucide-react'

interface VehicleSize {
  id: string
  name: string
}

interface ServiceFormData {
  name: string
  short_description: string
  long_description: string
  estimated_duration: number
  is_active: boolean
  pricing: {
    [vehicleSizeId: string]: number
  }
}

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  serviceName: string
  isDeleting: boolean
}

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, serviceName, isDeleting }: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--surface-primary)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--border-secondary)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[var(--error-bg)] rounded-lg flex items-center justify-center">
            <TrashIcon className="w-5 h-5 text-[var(--error)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Delete Service</h3>
            <p className="text-sm text-[var(--text-secondary)]">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-[var(--text-secondary)] mb-6">
          Are you sure you want to delete <strong className="text-[var(--text-primary)]">&quot;{serviceName}&quot;</strong>? 
          This will deactivate the service and it will no longer be available for booking.
        </p>

        <div className="flex items-center gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isDeleting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-[var(--error)] hover:bg-[var(--error)]/90 text-white"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <TrashIcon className="w-4 h-4 mr-2" />
                Delete Service
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [serviceId, setServiceId] = useState<string>('')
  const [vehicleSizes, setVehicleSizes] = useState<VehicleSize[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    short_description: '',
    long_description: '',
    estimated_duration: 60,
    is_active: true,
    pricing: {}
  })

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setServiceId(resolvedParams.id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!serviceId) return

    const fetchData = async () => {
      try {
        // Fetch service data, vehicle sizes, and pricing in parallel
        const [serviceResponse, vehicleSizesResponse, pricingResponse] = await Promise.all([
          fetch(`/api/services/${serviceId}`),
          fetch('/api/services/vehicle-sizes'),
          fetch('/api/admin/services/pricing')
        ])

        const serviceData = await serviceResponse.json()
        const vehicleSizesData = await vehicleSizesResponse.json()
        const pricingData = await pricingResponse.json()

        if (serviceData.success && serviceData.data) {
          const service = serviceData.data
          
          // Get pricing for this service
          const servicePricing: { [vehicleSizeId: string]: number } = {}
          if (pricingData.success && pricingData.data[serviceId]) {
            Object.entries(pricingData.data[serviceId]).forEach(([vehicleSizeId, pricing]) => {
              const pricingData = pricing as { price: number }
              servicePricing[vehicleSizeId] = pricingData.price || 0
            })
          }

          setFormData({
            name: service.name || '',
            short_description: service.short_description || '',
            long_description: service.full_description || '', // Use correct field name
            estimated_duration: service.duration_minutes || 60, // Use correct field name
            is_active: service.is_active ?? true,
            pricing: servicePricing
          })
        } else {
          setErrors({ load: 'Failed to load service data' })
        }

        if (vehicleSizesData.success) {
          setVehicleSizes(vehicleSizesData.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        setErrors({ load: 'Failed to load service data' })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [serviceId])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required'
    }

    if (!formData.short_description.trim()) {
      newErrors.short_description = 'Short description is required'
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
      // Update service details
      const serviceResponse = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          shortDescription: formData.short_description,
          longDescription: formData.long_description,
          estimatedDuration: formData.estimated_duration,
          isActive: formData.is_active
        })
      })

      const serviceData = await serviceResponse.json()
      
      if (!serviceData.success) {
        setErrors({ submit: serviceData.error?.message || 'Failed to update service' })
        return
      }

      // Update service pricing
      const pricingResponse = await fetch(`/api/admin/services/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: serviceId,
          pricing: formData.pricing
        })
      })

      const pricingData = await pricingResponse.json()
      
      if (!pricingData.success) {
        setErrors({ submit: pricingData.error?.message || 'Failed to update pricing' })
        return
      }

      router.push('/admin/services')
    } catch (error) {
      console.error('Failed to update service:', error)
      setErrors({ submit: 'Failed to update service. Please try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        router.push('/admin/services')
      } else {
        setErrors({ delete: data.error?.message || 'Failed to delete service' })
        setShowDeleteModal(false)
      }
    } catch (error) {
      console.error('Failed to delete service:', error)
      setErrors({ delete: 'Failed to delete service. Please try again.' })
      setShowDeleteModal(false)
    } finally {
      setIsDeleting(false)
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

  if (errors.load) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="bg-[var(--error-bg)] rounded-lg p-8 max-w-md mx-auto border border-[var(--error)]">
              <AlertCircleIcon className="w-12 h-12 text-[var(--error)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                Failed to Load Service
              </h3>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                {errors.load}
              </p>
              <Button
                onClick={() => router.push('/admin/services')}
                variant="outline"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Services
              </Button>
            </div>
          </div>
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
              Edit Service
            </h1>
            <p className="text-[var(--text-secondary)]">
              Update your detailing service details
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowDeleteModal(true)}
              variant="outline"
              className="text-[var(--error)] border-[var(--error)] hover:bg-[var(--error-bg)]"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button
              onClick={() => router.push('/admin/services')}
              variant="outline"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
          </div>
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
                      Vehicle Size Pricing (£) *
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
                      Set individual prices for each vehicle size
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

              {/* Service Status */}
              <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
                <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                  <TagIcon className="w-5 h-5" />
                  Service Status
                </h2>

                <div>
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
                  <p className="text-[var(--text-muted)] text-xs mt-2">
                    Inactive services are hidden from customers
                  </p>
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
            {(errors.submit || errors.delete) && (
              <p className="text-[var(--error)] text-sm flex items-center gap-1">
                <AlertCircleIcon className="w-4 h-4" />
                {errors.submit || errors.delete}
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
                    Updating...
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4" />
                    Update Service
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          serviceName={formData.name}
          isDeleting={isDeleting}
        />
      </div>
    </AdminLayout>
  )
}

export default function EditServicePageWithProtection({ params }: { params: Promise<{ id: string }> }) {
  return (
    <AdminRoute>
      <EditServicePage params={params} />
    </AdminRoute>
  )
}