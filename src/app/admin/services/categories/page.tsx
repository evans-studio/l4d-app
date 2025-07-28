'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { 
  ArrowLeftIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  TagIcon,
  MoveUpIcon,
  MoveDownIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from 'lucide-react'

interface ServiceCategory {
  id: string
  name: string
  description: string
  display_order: number
  is_active: boolean
  created_at: string
}

interface CategoryFormData {
  name: string
  description: string
  display_order: number
  is_active: boolean
}

interface CategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CategoryFormData) => void
  category?: ServiceCategory | null
  isLoading: boolean
}

interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  categoryName: string
  isDeleting: boolean
}

function CategoryModal({ isOpen, onClose, onSave, category, isLoading }: CategoryModalProps) {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    display_order: 0,
    is_active: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        display_order: category.display_order,
        is_active: category.is_active
      })
    } else {
      setFormData({
        name: '',
        description: '',
        display_order: 0,
        is_active: true
      })
    }
    setErrors({})
  }, [category, isOpen])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
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

  const handleInputChange = (field: keyof CategoryFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--surface-primary)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--border-secondary)]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[var(--primary-bg)] rounded-lg flex items-center justify-center">
            <TagIcon className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {category ? 'Edit Category' : 'Create Category'}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {category ? 'Update category details' : 'Add a new service category'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Exterior Detail"
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
              placeholder="Brief description of this category..."
              rows={3}
              className="w-full px-4 py-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors resize-none"
            />
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
                Active (visible to customers)
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
                  {category ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                category ? 'Update Category' : 'Create Category'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DeleteConfirmationModal({ isOpen, onClose, onConfirm, categoryName, isDeleting }: DeleteConfirmationModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--surface-primary)] rounded-lg p-6 max-w-md w-full mx-4 border border-[var(--border-secondary)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-[var(--error-bg)] rounded-lg flex items-center justify-center">
            <TrashIcon className="w-5 h-5 text-[var(--error)]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">Delete Category</h3>
            <p className="text-sm text-[var(--text-secondary)]">This action cannot be undone</p>
          </div>
        </div>

        <p className="text-[var(--text-secondary)] mb-6">
          Are you sure you want to delete <strong className="text-[var(--text-primary)]">"{categoryName}"</strong>?
          This will permanently remove the category from the system.
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
                Delete Category
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ServiceCategoriesPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<ServiceCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/services/categories')
      const data = await response.json()
      
      if (data.success) {
        setCategories(data.data || [])
      } else {
        setError('Failed to load categories')
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      setError('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCategory = () => {
    setEditingCategory(null)
    setShowModal(true)
  }

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory(category)
    setShowModal(true)
  }

  const handleSaveCategory = async (formData: CategoryFormData) => {
    setIsModalLoading(true)
    try {
      const url = editingCategory 
        ? `/api/services/categories/${editingCategory.id}`
        : '/api/services/categories'
      
      const method = editingCategory ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          displayOrder: formData.display_order,
          isActive: formData.is_active
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setShowModal(false)
        setEditingCategory(null)
        fetchCategories()
      } else {
        setError(data.error?.message || 'Failed to save category')
      }
    } catch (error) {
      console.error('Failed to save category:', error)
      setError('Failed to save category')
    } finally {
      setIsModalLoading(false)
    }
  }

  const handleDeleteCategory = (category: ServiceCategory) => {
    setDeletingCategory(category)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!deletingCategory) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/services/categories/${deletingCategory.id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      
      if (data.success) {
        setShowDeleteModal(false)
        setDeletingCategory(null)
        fetchCategories()
      } else {
        setError(data.error?.message || 'Failed to delete category')
        setShowDeleteModal(false)
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      setError('Failed to delete category')
      setShowDeleteModal(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleCategoryStatus = async (category: ServiceCategory) => {
    try {
      const response = await fetch(`/api/services/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !category.is_active })
      })

      if (response.ok) {
        fetchCategories()
      }
    } catch (error) {
      console.error('Failed to toggle category status:', error)
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

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
              Service Categories
            </h1>
            <p className="text-[var(--text-secondary)]">
              Organize your services into categories for better navigation
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
              onClick={handleCreateCategory}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Category
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-[var(--error-bg)] border border-[var(--error)] rounded-md p-4 mb-6">
            <p className="text-[var(--error)] text-sm">{error}</p>
          </div>
        )}

        {/* Categories List */}
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-[var(--surface-secondary)] rounded-lg p-8 max-w-md mx-auto">
              <TagIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                No Categories Found
              </h3>
              <p className="text-[var(--text-secondary)] text-sm mb-4">
                Start by creating your first service category.
              </p>
              <Button
                onClick={handleCreateCategory}
                className="flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Create First Category
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-[var(--surface-secondary)] rounded-lg border border-[var(--border-secondary)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--surface-tertiary)] border-b border-[var(--border-secondary)]">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-primary)]">
                      Category
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-medium text-[var(--text-primary)]">
                      Description
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-[var(--text-primary)]">
                      Order
                    </th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-[var(--text-primary)]">
                      Status
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-[var(--text-primary)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {categories
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((category) => (
                    <tr key={category.id} className="border-b border-[var(--border-secondary)] hover:bg-[var(--surface-tertiary)]">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            category.is_active 
                              ? 'bg-[var(--success-bg)] text-[var(--success)]'
                              : 'bg-[var(--warning-bg)] text-[var(--warning)]'
                          }`}>
                            <TagIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--text-primary)]">
                              {category.name}
                            </p>
                            <p className="text-sm text-[var(--text-muted)]">
                              Created {new Date(category.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-[var(--text-secondary)] text-sm">
                          {category.description || 'No description'}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-[var(--surface-tertiary)] text-[var(--text-secondary)]">
                          {category.display_order}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => toggleCategoryStatus(category)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            category.is_active
                              ? 'bg-[var(--success-bg)] text-[var(--success)] hover:bg-[var(--success-bg)]/80'
                              : 'bg-[var(--warning-bg)] text-[var(--warning)] hover:bg-[var(--warning-bg)]/80'
                          }`}
                        >
                          {category.is_active ? (
                            <>
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            onClick={() => handleEditCategory(category)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <EditIcon className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button
                            onClick={() => handleDeleteCategory(category)}
                            variant="outline"
                            size="sm"
                            className="text-[var(--error)] border-[var(--error)] hover:bg-[var(--error-bg)] flex items-center gap-1"
                          >
                            <TrashIcon className="w-3 h-3" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Category Modal */}
        <CategoryModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false)
            setEditingCategory(null)
            setError('')
          }}
          onSave={handleSaveCategory}
          category={editingCategory}
          isLoading={isModalLoading}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setDeletingCategory(null)
            setError('')
          }}
          onConfirm={confirmDelete}
          categoryName={deletingCategory?.name || ''}
          isDeleting={isDeleting}
        />
      </div>
    </AdminLayout>
  )
}