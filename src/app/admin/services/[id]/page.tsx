'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { 
  ArrowLeftIcon,
  SaveIcon,
  PackageIcon,
  AlertCircleIcon,
  TrashIcon
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
}

export default function AdminServiceEditPage() {
  const params = useParams()
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    base_price: 0,
    duration_minutes: 60,
    is_active: true
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch service details
        if (params.id && params.id !== 'new') {
          const serviceResponse = await fetch(`/api/services/${params.id}`)
          const serviceData = await serviceResponse.json()
          
          if (serviceData.success && serviceData.data) {
            setService(serviceData.data)
            setFormData({
              name: serviceData.data.name,
              description: serviceData.data.description,
              category: serviceData.data.category || '',
              base_price: serviceData.data.base_price,
              duration_minutes: serviceData.data.duration_minutes,
              is_active: serviceData.data.is_active
            })
          }
        }

        // Fetch categories
        const categoriesResponse = await fetch('/api/services/categories')
        const categoriesData = await categoriesResponse.json()
        
        if (categoriesData.success) {
          setCategories(categoriesData.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch service data:', error)
        setError('Failed to load service data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError('')

    try {
      const url = params.id === 'new' 
        ? '/api/services'
        : `/api/services/${params.id}`
      
      const method = params.id === 'new' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/services')
      } else {
        setError(data.error?.message || 'Failed to save service')
      }
    } catch (error) {
      console.error('Failed to save service:', error)
      setError('Failed to save service')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const deleteService = async () => {
    if (!service || !confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/services/${service.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/admin/services')
      } else {
        setError('Failed to delete service')
      }
    } catch (error) {
      console.error('Failed to delete service:', error)
      setError('Failed to delete service')
    }
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

  if (params.id !== 'new' && !service) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="bg-[var(--surface-secondary)] rounded-lg p-8 max-w-md mx-auto">
            <AlertCircleIcon className="w-12 h-12 text-[var(--error)] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Service Not Found
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              The service you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/admin/services')} variant="outline">
              Back to Services
            </Button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const isNewService = params.id === 'new'

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push('/admin/services')}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                {isNewService ? 'Add New Service' : 'Edit Service'}
              </h1>
              <p className="text-[var(--text-secondary)]">
                {isNewService ? 'Create a new detailing service' : 'Update service details and pricing'}
              </p>
            </div>
          </div>
          
          {!isNewService && service && (
            <Button
              onClick={deleteService}
              variant="outline"
              className="text-[var(--error)] border-[var(--error)] hover:bg-[var(--error-bg)]"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
        </div>

        {/* Form */}
        <div className="bg-[var(--surface-secondary)] rounded-lg p-8 border border-[var(--border-secondary)]">
          {error && (
            <div className="bg-[var(--error-bg)] border border-[var(--error)] rounded-md p-4 mb-6">
              <p className="text-[var(--error)] text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Service Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                placeholder="e.g., Full Exterior Detail"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors resize-none"
                placeholder="Describe what's included in this service..."
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing and Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Base Price (£) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.base_price}
                  onChange={(e) => handleInputChange('base_price', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="15"
                  step="15"
                  value={formData.duration_minutes}
                  onChange={(e) => handleInputChange('duration_minutes', parseInt(e.target.value) || 60)}
                  className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                  placeholder="60"
                />
              </div>
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="w-4 h-4 text-[var(--primary)] border border-[var(--input-border)] rounded focus:ring-[var(--primary)] focus:ring-2"
                />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Active Service
                </span>
              </label>
              <p className="text-sm text-[var(--text-secondary)] mt-1 ml-7">
                Only active services are available for booking
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center gap-4 pt-6 border-t border-[var(--border-secondary)]">
              <Button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <SaveIcon className="w-4 h-4" />
                {isSaving ? 'Saving...' : isNewService ? 'Create Service' : 'Update Service'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/services')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  )
}