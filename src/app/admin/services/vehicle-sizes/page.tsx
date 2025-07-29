'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { 
  ArrowLeftIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CarIcon,
  DollarSignIcon,
  AlertCircleIcon,
  XIcon
} from 'lucide-react'

interface VehicleSize {
  id: string
  name: string
  description: string
  price_multiplier: number
  examples?: string[]
  display_order: number
  is_active: boolean
  created_at: string
}

interface VehicleSizeFormData {
  name: string
  description: string
  price_multiplier: number
  examples: string[]
  display_order: number
  is_active: boolean
}

interface VehicleSizeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: VehicleSizeFormData) => void
  vehicleSize?: VehicleSize | null
  isLoading: boolean
}

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  vehicleSizeName: string
  isDeleting: boolean
}

function VehicleSizeModal({ isOpen, onClose, onSave, vehicleSize, isLoading }: VehicleSizeModalProps) {
  const [formData, setFormData] = useState<VehicleSizeFormData>({
    name: '',
    description: '',
    price_multiplier: 1.0,
    examples: [],
    display_order: 0,
    is_active: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [newExample, setNewExample] = useState('')

  useEffect(() => {
    if (vehicleSize) {
      setFormData({
        name: vehicleSize.name,
        description: vehicleSize.description || '',
        price_multiplier: vehicleSize.price_multiplier,
        examples: vehicleSize.examples || [],
        display_order: vehicleSize.display_order,
        is_active: vehicleSize.is_active
      })
    } else {
      setFormData({
        name: '',
        description: '',
        price_multiplier: 1.0,
        examples: [],
        display_order: 0,
        is_active: true
      })
    }
    setErrors({})
    setNewExample('')
  }, [vehicleSize, isOpen])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vehicle size name is required'
    }

    if (formData.price_multiplier <= 0 || formData.price_multiplier > 10) {
      newErrors.price_multiplier = 'Price multiplier must be between 0.1 and 10'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      onSave(formData)
    }
  }

  const handleInputChange = (field: keyof VehicleSizeFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addExample = () => {
    if (newExample.trim() && !formData.examples.includes(newExample.trim())) {
      setFormData(prev => ({
        ...prev,
        examples: [...prev.examples, newExample.trim()]
      }))
      setNewExample('')
    }
  }

  const removeExample = (index: number) => {
    setFormData(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index)
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addExample()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--surface-primary)] rounded-lg p-6 max-w-lg w-full mx-4 border border-[var(--border-secondary)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--primary-bg)] rounded-lg flex items-center justify-center">
            <CarIcon className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {vehicleSize ? 'Edit Vehicle Size' : 'Create Vehicle Size'}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {vehicleSize ? 'Update vehicle size details' : 'Add a new vehicle size category'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Size Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Medium"
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
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of this vehicle size category..."
              rows={3}
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Price Multiplier *
            </label>
            <div className="relative">
              <DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={formData.price_multiplier}
                onChange={(e) => handleInputChange('price_multiplier', parseFloat(e.target.value) || 1.0)}
                className={`w-full pl-10 pr-4 py-3 bg-[var(--input-bg)] border rounded-md text-[var(--input-text)] focus:outline-none transition-colors ${
                  errors.price_multiplier ? 'border-[var(--error)]' : 'border-[var(--input-border)] focus:border-[var(--input-border-focus)]'
                }`}
              />
            </div>
            {errors.price_multiplier && (
              <p className="text-[var(--error)] text-sm mt-1 flex items-center gap-1">
                <AlertCircleIcon className="w-4 h-4" />
                {errors.price_multiplier}
              </p>
            )}
            <p className="text-[var(--text-muted)] text-xs mt-1">
              Services will be multiplied by this factor (1.0 = base price)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Vehicle Examples
            </label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newExample}
                  onChange={(e) => setNewExample(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="e.g., BMW 3 Series"
                  className="flex-1 px-4 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors"
                />
                <Button
                  type="button"
                  onClick={addExample}
                  size="sm"
                  disabled={!newExample.trim()}
                >
                  Add
                </Button>
              </div>
              {formData.examples.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.examples.map((example, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--surface-tertiary)] text-[var(--text-secondary)] rounded-full text-sm"
                    >
                      <span>{example}</span>
                      <button
                        type="button"
                        onClick={() => removeExample(index)}
                        className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                      >
                        <XIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="w-4 h-4 text-[var(--primary)] border border-[var(--input-border)] rounded focus:ring-[var(--primary)]"
              />
              <span className="text-sm text-[var(--text-primary)]">
                Active (available for selection)
              </span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-secondary)]">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {vehicleSize ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                vehicleSize ? 'Update Size' : 'Create Size'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, vehicleSizeName, isDeleting }: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--surface-primary)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--border-secondary)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[var(--error-bg)] rounded-lg flex items-center justify-center">
            <TrashIcon className="w-5 h-5 text-[var(--error)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Delete Vehicle Size</h3>
            <p className="text-sm text-[var(--text-secondary)]">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-[var(--text-secondary)] mb-6">
          Are you sure you want to delete <strong className="text-[var(--text-primary)]">&quot;{vehicleSizeName}&quot;</strong>?
          This will deactivate the vehicle size and it will no longer be available for selection.
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
                Delete Size
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function VehicleSizesPage() {
  const router = useRouter()
  const [vehicleSizes, setVehicleSizes] = useState<VehicleSize[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingVehicleSize, setEditingVehicleSize] = useState<VehicleSize | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingVehicleSize, setDeletingVehicleSize] = useState<VehicleSize | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchVehicleSizes()
  }, [])

  const fetchVehicleSizes = async () => {
    try {
      const response = await fetch('/api/services/vehicle-sizes')
      const data = await response.json()
      
      if (data.success) {
        setVehicleSizes(data.data || [])
      } else {
        setError('Failed to load vehicle sizes')
      }
    } catch (error) {
      console.error('Failed to fetch vehicle sizes:', error)
      setError('Failed to load vehicle sizes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateVehicleSize = () => {
    setEditingVehicleSize(null)
    setShowModal(true)
  }

  const handleEditVehicleSize = (vehicleSize: VehicleSize) => {
    setEditingVehicleSize(vehicleSize)
    setShowModal(true)
  }

  const handleSaveVehicleSize = async (formData: VehicleSizeFormData) => {
    setIsModalLoading(true)
    try {
      const url = editingVehicleSize 
        ? `/api/services/vehicle-sizes/${editingVehicleSize.id}`
        : '/api/services/vehicle-sizes'
      
      const method = editingVehicleSize ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          priceMultiplier: formData.price_multiplier,
          examples: formData.examples,
          displayOrder: formData.display_order,
          isActive: formData.is_active
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setShowModal(false)
        setEditingVehicleSize(null)
        fetchVehicleSizes()
      } else {
        setError(data.error?.message || 'Failed to save vehicle size')
      }
    } catch (error) {
      console.error('Failed to save vehicle size:', error)
      setError('Failed to save vehicle size')
    } finally {
      setIsModalLoading(false)
    }
  }

  const handleDeleteVehicleSize = (vehicleSize: VehicleSize) => {
    setDeletingVehicleSize(vehicleSize)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingVehicleSize) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/services/vehicle-sizes/${deletingVehicleSize.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        setShowDeleteModal(false)
        setDeletingVehicleSize(null)
        fetchVehicleSizes()
      } else {
        setError(data.error?.message || 'Failed to delete vehicle size')
        setShowDeleteModal(false)
      }
    } catch (error) {
      console.error('Failed to delete vehicle size:', error)
      setError('Failed to delete vehicle size')
      setShowDeleteModal(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleVehicleSizeStatus = async (vehicleSize: VehicleSize) => {
    try {
      const response = await fetch(`/api/services/vehicle-sizes/${vehicleSize.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !vehicleSize.is_active })
      })

      if (response.ok) {
        fetchVehicleSizes()
      }
    } catch (error) {
      console.error('Failed to toggle vehicle size status:', error)
    }
  }

  const formatMultiplier = (multiplier: number) => {
    return `${multiplier}x`
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Vehicle Sizes
            </h1>
            <p className="text-[var(--text-secondary)]">
              Manage vehicle size categories and pricing multipliers
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/admin/services')}
              variant="outline"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
            <Button
              onClick={handleCreateVehicleSize}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Vehicle Size
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-[var(--error-bg)] border border-[var(--error)] rounded-md p-4 mb-6">
            <p className="text-[var(--error)] text-sm">{error}</p>
          </div>
        )}

        {/* Vehicle Sizes List */}
        {vehicleSizes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-[var(--surface-secondary)] rounded-lg p-8 max-w-md mx-auto">
              <CarIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                No Vehicle Sizes Found
              </h3>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                Start by creating your first vehicle size category.
              </p>
              <Button
                onClick={handleCreateVehicleSize}
                className="flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Create First Size
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicleSizes
              .sort((a, b) => a.display_order - b.display_order)
              .map((vehicleSize) => (
              <div
                key={vehicleSize.id}
                className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)] hover:border-[var(--border-primary)] transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      vehicleSize.is_active 
                        ? 'bg-[var(--success-bg)] text-[var(--success)]'
                        : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                    }`}>
                      <CarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--text-primary)]">
                        {vehicleSize.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          vehicleSize.is_active 
                            ? 'bg-[var(--success-bg)] text-[var(--success)]'
                            : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                        }`}>
                          {vehicleSize.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[var(--primary-bg)] text-[var(--primary)]">
                          {formatMultiplier(vehicleSize.price_multiplier)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3 mb-4">
                  <p className="text-[var(--text-secondary)] text-sm">
                    {vehicleSize.description || 'No description'}
                  </p>
                  
                  {vehicleSize.examples && vehicleSize.examples.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-[var(--text-primary)] mb-2">Examples:</p>
                      <div className="flex flex-wrap gap-1">
                        {vehicleSize.examples.slice(0, 3).map((example, index) => (
                          <span
                            key={index}
                            className="inline-block px-2 py-1 bg-[var(--surface-tertiary)] text-[var(--text-muted)] rounded text-xs"
                          >
                            {example}
                          </span>
                        ))}
                        {vehicleSize.examples.length > 3 && (
                          <span className="inline-block px-2 py-1 bg-[var(--surface-tertiary)] text-[var(--text-muted)] rounded text-xs">
                            +{vehicleSize.examples.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-[var(--border-secondary)]">
                  <Button
                    onClick={() => handleEditVehicleSize(vehicleSize)}
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center gap-2"
                  >
                    <EditIcon className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => toggleVehicleSizeStatus(vehicleSize)}
                    variant={vehicleSize.is_active ? "outline" : "primary"}
                    size="sm"
                    className="flex-1"
                  >
                    {vehicleSize.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    onClick={() => handleDeleteVehicleSize(vehicleSize)}
                    variant="outline"
                    size="sm"
                    className="text-[var(--error)] border-[var(--error)] hover:bg-[var(--error-bg)]"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Vehicle Size Modal */}
        <VehicleSizeModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setEditingVehicleSize(null)
            setError('')
          }}
          onSave={handleSaveVehicleSize}
          vehicleSize={editingVehicleSize}
          isLoading={isModalLoading}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setDeletingVehicleSize(null)
            setError('')
          }}
          onConfirm={confirmDelete}
          vehicleSizeName={deletingVehicleSize?.name || ''}
          isDeleting={isDeleting}
        />
      </div>
    </AdminLayout>
  )
}

export default function VehicleSizesPageWithProtection() {
  return (
    <AdminRoute>
      <VehicleSizesPage />
    </AdminRoute>
  )
}