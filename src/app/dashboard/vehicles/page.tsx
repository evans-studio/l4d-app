'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Input } from '@/components/ui/primitives/Input'
import { Checkbox } from '@/components/ui/primitives/Checkbox'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { VehicleCard } from '@/components/customer/components/VehicleCard'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { CustomerRoute } from '@/components/ProtectedRoute'
import { Plus, Car, AlertCircle, Calendar, Palette, Hash } from 'lucide-react'

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

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return

    try {
      const response = await fetch(`/api/customer/vehicles/${vehicleId}`, {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        await fetchVehicles()
      } else {
        setError(result.error?.message || 'Failed to delete vehicle')
      }
    } catch (err) {
      setError('Failed to delete vehicle')
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
                  <Input
                    label="Make"
                    required
                    value={formData.make}
                    onChange={(e) => setFormData(prev => ({ ...prev, make: e.target.value }))}
                    placeholder="e.g., Toyota, BMW, Ford"
                    leftIcon={<Car className="w-4 h-4" />}
                    helperText="Vehicle manufacturer"
                  />

                  {/* Model */}
                  <Input
                    label="Model"
                    required
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="e.g., Corolla, 3 Series, Focus"
                    leftIcon={<Car className="w-4 h-4" />}
                    helperText="Vehicle model name"
                  />

                  {/* Year */}
                  <Input
                    label="Year"
                    type="number"
                    required
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    value={formData.year.toString()}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) || new Date().getFullYear() }))}
                    leftIcon={<Calendar className="w-4 h-4" />}
                    helperText="Manufacturing year"
                  />

                  {/* Color */}
                  <Input
                    label="Color"
                    required
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="e.g., Black, White, Silver"
                    leftIcon={<Palette className="w-4 h-4" />}
                    helperText="Primary vehicle color"
                  />

                  {/* License Plate */}
                  <Input
                    label="License Plate"
                    optional
                    value={formData.license_plate}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value }))}
                    placeholder="e.g., AB12 CDE"
                    leftIcon={<Hash className="w-4 h-4" />}
                    helperText="Vehicle registration number"
                    className="font-mono"
                  />

                </div>

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
      </CustomerLayout>
    </CustomerRoute>
  )
}