'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Select } from '@/components/ui/primitives/Select'
import { Checkbox } from '@/components/ui/primitives/Checkbox'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { VehicleCard } from '@/components/customer/components/VehicleCard'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { CustomerRoute } from '@/components/ProtectedRoute'
import { Plus, Car, AlertCircle, Calendar, Palette, Hash } from 'lucide-react'
import { ConfirmationModal } from '@/components/ui/composites/ConfirmationModal'
import vehicleData from '@/data/vehicle-size-data.json'

// Vehicle data interfaces
interface VehicleModel {
  model: string
  size: 'S' | 'M' | 'L' | 'XL'
  years: number[]
}

interface VehicleMake {
  make: string
  models: VehicleModel[]
}

interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  color: string
  license_plate?: string
  vehicle_size: {
    id: string
    size: 'S' | 'M' | 'L' | 'XL'
    multiplier: number
    name: string
    description: string
  }
  is_primary: boolean
  is_default: boolean
  last_used?: string
  booking_count: number
  created_at: string
  updated_at: string
}


export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)

  // Add/Edit form state
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    license_plate: '',
    set_as_default: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Vehicle data processing
  const availableMakes = vehicleData.vehicles.map(v => v.make).sort()
  
  const availableModels = formData.make 
    ? vehicleData.vehicles.find(v => v.make === formData.make)?.models || []
    : []

  const availableYears = formData.make && formData.model
    ? availableModels.find(m => m.model === formData.model)?.years || []
    : []

  // Size detection function
  const getVehicleSize = (make: string, model: string): string => {
    const vehicleMake = vehicleData.vehicles.find(v => v.make === make)
    if (vehicleMake) {
      const vehicleModel = vehicleMake.models.find(m => m.model === model)
      if (vehicleModel) {
        return vehicleModel.size
      }
    }
    return 'M' // Default to medium
  }

  // Size configuration with multipliers
  const sizeConfig = {
    S: { label: 'Small', multiplier: 1.0 },
    M: { label: 'Medium', multiplier: 1.2 },
    L: { label: 'Large', multiplier: 1.4 },
    XL: { label: 'Extra Large', multiplier: 1.6 }
  } as const

  // Fetch vehicles
  useEffect(() => {
    fetchVehicles().finally(() => setIsLoading(false))
  }, [])

  const fetchVehicles = async () => {
    try {
      const response = await fetch('/api/customer/vehicles')
      const result = await response.json()
      
      if (result.success) {
        setVehicles(result.data)
      } else {
        setError(result.error?.message || 'Failed to fetch vehicles')
      }
    } catch (err) {
      setError('Failed to load vehicles')
    }
  }

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => {
      const newForm = { ...prev, [field]: value }
      
      // Reset dependent fields when make changes
      if (field === 'make') {
        newForm.model = ''
        newForm.year = new Date().getFullYear()
      }
      
      // Reset year when model changes
      if (field === 'model') {
        newForm.year = new Date().getFullYear()
      }
      
      return newForm
    })
  }

  const handleAddVehicle = () => {
    setEditingVehicle(null)
    setFormData({
      make: '',
      model: '',
      year: new Date().getFullYear(),
      color: '',
      license_plate: '',
      set_as_default: vehicles.length === 0
    })
    setShowAddForm(true)
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle)
    setFormData({
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color,
      license_plate: vehicle.license_plate || '',
      set_as_default: vehicle.is_default
    })
    setShowAddForm(true)
  }

  const handleSubmitVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const url = editingVehicle 
        ? `/api/customer/vehicles/${editingVehicle.id}`
        : '/api/customer/vehicles'
      
      const method = editingVehicle ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchVehicles()
        setShowAddForm(false)
        setEditingVehicle(null)
      } else {
        setError(result.error?.message || 'Failed to save vehicle')
      }
    } catch (err) {
      setError('Failed to save vehicle')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (vehicle) {
      setVehicleToDelete(vehicle)
      setShowDeleteConfirm(true)
    }
  }

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/customer/vehicles/${vehicleToDelete.id}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchVehicles()
        setShowDeleteConfirm(false)
        setVehicleToDelete(null)
      } else {
        setError(result.error?.message || 'Failed to delete vehicle')
      }
    } catch (err) {
      setError('Failed to delete vehicle')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSetDefault = async (vehicleId: string) => {
    try {
      const vehicle = vehicles.find(v => v.id === vehicleId)
      if (!vehicle) return

      const response = await fetch(`/api/customer/vehicles/${vehicleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          license_plate: vehicle.license_plate,
          set_as_default: true
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchVehicles()
      } else {
        setError(result.error?.message || 'Failed to set default vehicle')
      }
    } catch (err) {
      setError('Failed to set default vehicle')
    }
  }

  const closeForm = () => {
    setShowAddForm(false)
    setEditingVehicle(null)
    setError(null)
  }

  if (isLoading) {
    return (
      <CustomerRoute>
        <CustomerLayout>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
            </div>
          </div>
        </CustomerLayout>
      </CustomerRoute>
    )
  }

  return (
    <CustomerRoute>
      <CustomerLayout>
        <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">My Vehicles</h1>
            <p className="text-text-secondary">
              Manage your vehicles for faster booking and accurate pricing
            </p>
          </div>
          <Button
            onClick={handleAddVehicle}
            leftIcon={<Plus className="w-5 h-5" />}
            className="sm:w-auto w-full"
          >
            Add Vehicle
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="border-error-200 bg-error-600/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-error-400 flex-shrink-0" />
                <p className="text-error-600">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-text-primary">
                  {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
                </h2>
                <Button variant="ghost" size="sm" onClick={closeForm}>
                  ✕
                </Button>
              </div>

              <form onSubmit={handleSubmitVehicle} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Make */}
                  <Select
                    label="Make"
                    required
                    placeholder="Select vehicle make"
                    options={availableMakes.map(make => ({ value: make, label: make }))}
                    value={formData.make}
                    onChange={(e) => handleFormChange('make', e.target.value)}
                    leftIcon={<Car className="w-4 h-4" />}
                    helperText="Vehicle manufacturer"
                  />

                  {/* Model */}
                  <Select
                    label="Model"
                    required
                    placeholder="Select vehicle model"
                    options={availableModels.map(model => ({ value: model.model, label: model.model }))}
                    value={formData.model}
                    onChange={(e) => handleFormChange('model', e.target.value)}
                    leftIcon={<Car className="w-4 h-4" />}
                    helperText={!formData.make ? "Select a make first" : "Vehicle model name"}
                    disabled={!formData.make}
                  />

                  {/* Year */}
                  <Select
                    label="Year"
                    optional
                    placeholder="Select year"
                    options={availableYears.map(year => ({ value: year.toString(), label: year.toString() }))}
                    value={formData.year.toString()}
                    onChange={(e) => handleFormChange('year', parseInt(e.target.value))}
                    leftIcon={<Calendar className="w-4 h-4" />}
                    helperText={!formData.model ? "Select a model first" : "Manufacturing year (optional)"}
                    disabled={!formData.model}
                  />

                  {/* Color */}
                  <Input
                    label="Color"
                    optional
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="e.g., Black, White, Silver"
                    leftIcon={<Palette className="w-4 h-4" />}
                    helperText="Primary vehicle color (optional)"
                  />

                  {/* License Plate */}
                  <Input
                    label="License Plate"
                    required
                    value={formData.license_plate}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value }))}
                    placeholder="e.g., AB12 CDE"
                    leftIcon={<Hash className="w-4 h-4" />}
                    helperText="Vehicle registration number"
                    className="font-mono"
                  />

                </div>

                {/* Vehicle Size Detection */}
                {formData.make && formData.model && (
                  <div className="bg-surface-tertiary rounded-lg p-4">
                    <h4 className="font-medium text-text-primary mb-2 flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Auto-Detected Vehicle Size
                    </h4>
                    {(() => {
                      const detectedSize = getVehicleSize(formData.make, formData.model)
                      const sizeInfo = sizeConfig[detectedSize as keyof typeof sizeConfig]
                      return (
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-brand-600">
                              {sizeInfo.label} ({detectedSize})
                            </p>
                            <p className="text-sm text-text-secondary">
                              Price multiplier: {sizeInfo.multiplier}x
                            </p>
                          </div>
                          <div className="text-xs text-text-muted">
                            Based on {formData.make} {formData.model}
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Set as Default */}
                {!editingVehicle && vehicles.length > 0 && (
                  <Checkbox
                    label="Set as default vehicle for bookings"
                    description="This vehicle will be pre-selected when creating new bookings"
                    checked={formData.set_as_default}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, set_as_default: checked }))}
                  />
                )}

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                    className="sm:w-auto w-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    leftIcon={isSubmitting ? 
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> :
                      <Car className="w-4 h-4" />
                    }
                    className="sm:w-auto w-full"
                  >
                    {isSubmitting 
                      ? (editingVehicle ? 'Updating...' : 'Adding...') 
                      : (editingVehicle ? 'Update Vehicle' : 'Add Vehicle')
                    }
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Vehicles List */}
        {vehicles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Car className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No vehicles yet</h3>
              <p className="text-text-secondary mb-6">
                Add your first vehicle to get started with faster bookings and accurate pricing
              </p>
              <Button onClick={handleAddVehicle} leftIcon={<Plus className="w-5 h-5" />}>
                Add Your First Vehicle
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {vehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                variant="detailed"
                onEdit={handleEditVehicle}
                onDelete={handleDeleteVehicle}
                onSetDefault={handleSetDefault}
              />
            ))}
          </div>
        )}
        </div>

        {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false)
            setVehicleToDelete(null)
          }}
          onConfirm={confirmDeleteVehicle}
          title="Delete Vehicle"
          message={
            vehicleToDelete
              ? `Are you sure you want to delete the ${vehicleToDelete.year} ${vehicleToDelete.make} ${vehicleToDelete.model}? This action cannot be undone.`
              : 'Are you sure you want to delete this vehicle?'
          }
          confirmText="Delete Vehicle"
          confirmVariant="danger"
          isLoading={isDeleting}
        />
      </CustomerLayout>
    </CustomerRoute>
  )
}