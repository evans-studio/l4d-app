'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { VehicleCard } from '@/components/customer/components/VehicleCard'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { CustomerRoute } from '@/components/ProtectedRoute'
import { useOverlay } from '@/lib/overlay/context'
import { Plus, Car, AlertCircle } from 'lucide-react'

// Vehicle data interfaces
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
  const { openOverlay } = useOverlay()

  // Local state for delete action tracking
  const [vehicleToDelete, setVehicleToDelete] = useState<Vehicle | null>(null)

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
    openOverlay({
      type: 'vehicle-create',
      data: {},
      onConfirm: async () => {
        await fetchVehicles()
      }
    })
  }

  const handleEditVehicle = (vehicle: Vehicle) => {
    openOverlay({
      type: 'vehicle-edit',
      data: { vehicleId: vehicle.id, vehicle },
      onConfirm: async () => {
        await fetchVehicles()
      }
    })
  }

  const handleDeleteVehicle = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId)
    if (vehicle) {
      setVehicleToDelete(vehicle)
      openOverlay({
        type: 'confirm-delete',
        data: {
          title: 'Delete Vehicle',
          message: `Are you sure you want to delete the ${vehicle.year} ${vehicle.make} ${vehicle.model}? This action cannot be undone.`,
          confirmText: 'Delete Vehicle',
          itemName: 'vehicle'
        },
        onConfirm: async () => {
          await confirmDeleteVehicle()
        }
      })
    }
  }

  const confirmDeleteVehicle = async () => {
    if (!vehicleToDelete) return
    try {
      const response = await fetch(`/api/customer/vehicles/${vehicleToDelete.id}`, {
        method: 'DELETE'
      })
      const result = await response.json()
      if (result.success) {
        await fetchVehicles()
        setVehicleToDelete(null)
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

        {/* Deletion handled by overlay */}
      </CustomerLayout>
    </CustomerRoute>
  )
}