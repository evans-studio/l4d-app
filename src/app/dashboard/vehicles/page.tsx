'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/primitives/Button'
import { CustomerLayout } from '@/components/layout/templates/CustomerLayout'
import { Container } from '@/components/layout/templates/PageLayout'
import { CustomerRoute } from '@/components/auth/ProtectedRoute'
import { 
  Car, 
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Search
} from 'lucide-react'

interface Vehicle {
  id: string
  make: string
  model: string
  year?: number
  color?: string
  license_plate?: string
  vehicle_size: 'small' | 'medium' | 'large' | 'xl'
  notes?: string
  created_at: string
  updated_at: string
  _count?: {
    bookings: number
  }
}

const vehicleSizeConfig = {
  small: {
    label: 'Small',
    description: 'Hatchbacks, city cars',
    color: 'text-blue-400',
    bgColor: 'bg-blue-600/10',
    borderColor: 'border-blue-500/20'
  },
  medium: {
    label: 'Medium',
    description: 'Sedans, compact SUVs',
    color: 'text-green-400',
    bgColor: 'bg-green-600/10',
    borderColor: 'border-green-500/20'
  },
  large: {
    label: 'Large',
    description: 'Large SUVs, vans',
    color: 'text-orange-400',
    bgColor: 'bg-orange-600/10',
    borderColor: 'border-orange-500/20'
  },
  xl: {
    label: 'Extra Large',
    description: 'Trucks, large vans',
    color: 'text-red-400',
    bgColor: 'bg-red-600/10',
    borderColor: 'border-red-500/20'
  }
}

export default function MyVehiclesPage() {
  const router = useRouter()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; vehicle: Vehicle | null }>({
    isOpen: false,
    vehicle: null
  })

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const response = await fetch('/api/customer/vehicles')
        const data = await response.json()
        
        if (data.success) {
          setVehicles(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchVehicles()
  }, [])

  const handleDeleteVehicle = async (vehicleId: string) => {
    try {
      const response = await fetch(`/api/customer/vehicles/${vehicleId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setVehicles(prev => prev.filter(v => v.id !== vehicleId))
        setDeleteModal({ isOpen: false, vehicle: null })
      } else {
        alert('Failed to delete vehicle. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error)
      alert('Failed to delete vehicle. Please try again.')
    }
  }

  const getFilteredVehicles = () => {
    if (!searchTerm) return vehicles
    
    return vehicles.filter(vehicle =>
      vehicle.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.color?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const filteredVehicles = getFilteredVehicles()

  if (isLoading) {
    return (
      <CustomerRoute>
        <CustomerLayout>
          <Container>
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
            </div>
          </Container>
        </CustomerLayout>
      </CustomerRoute>
    )
  }

  return (
    <CustomerRoute>
      <CustomerLayout>
        <Container>
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                My Vehicles
              </h1>
              <p className="text-text-secondary">
                Manage your saved vehicles for faster booking
              </p>
            </div>
            
            <Button
              variant="primary"
              onClick={() => router.push('/dashboard/vehicles/add')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Vehicle
            </Button>
          </div>

          {/* Search */}
          <div className="relative max-w-md mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-secondary border border-border-secondary rounded-md text-text-primary placeholder-text-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-600/20 transition-colors"
            />
          </div>

          {/* Vehicles List */}
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-surface-secondary rounded-lg p-8 max-w-md mx-auto">
                <Car className="w-12 h-12 text-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {searchTerm ? 'No vehicles found' : 'No vehicles saved'}
                </h3>
                <p className="text-text-secondary text-sm mb-6">
                  {searchTerm ? 'Try adjusting your search terms.' :
                   'Add your vehicles to make booking faster and easier. Your vehicle details will be saved for future appointments.'}
                </p>
                {!searchTerm && (
                  <Button
                    variant="primary"
                    onClick={() => router.push('/dashboard/vehicles/add')}
                    leftIcon={<Plus className="w-4 h-4" />}
                  >
                    Add Your First Vehicle
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVehicles.map((vehicle) => {
                const sizeConfig = vehicleSizeConfig[vehicle.vehicle_size]
                
                return (
                  <div
                    key={vehicle.id}
                    className="bg-surface-secondary rounded-lg p-6 border border-border-secondary hover:border-border-primary transition-colors"
                  >
                    {/* Vehicle Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-brand-600/10 rounded-full flex items-center justify-center">
                        <Car className="w-6 h-6 text-brand-400" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/vehicles/${vehicle.id}/edit`)}
                          leftIcon={<Edit className="w-4 h-4" />}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteModal({ isOpen: true, vehicle })}
                          leftIcon={<Trash2 className="w-4 h-4" />}
                          className="text-error-400 hover:text-error-300"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                          {vehicle.make} {vehicle.model}
                        </h3>
                        {vehicle.year && (
                          <p className="text-text-secondary text-sm">
                            {vehicle.year}
                          </p>
                        )}
                      </div>

                      {vehicle.color && (
                        <div className="flex items-center gap-2">
                          <span className="text-text-secondary text-sm">Color:</span>
                          <span className="text-text-primary text-sm font-medium">{vehicle.color}</span>
                        </div>
                      )}

                      {vehicle.license_plate && (
                        <div className="flex items-center gap-2">
                          <span className="text-text-secondary text-sm">License:</span>
                          <span className="text-text-primary text-sm font-mono bg-surface-primary px-2 py-1 rounded">
                            {vehicle.license_plate}
                          </span>
                        </div>
                      )}

                      {/* Vehicle Size */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border ${sizeConfig.bgColor} ${sizeConfig.borderColor}`}>
                        <span className={sizeConfig.color}>{sizeConfig.label}</span>
                      </div>

                      {/* Booking Count */}
                      {vehicle._count && (
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <Calendar className="w-4 h-4" />
                          <span>{vehicle._count.bookings} booking{vehicle._count.bookings !== 1 ? 's' : ''}</span>
                        </div>
                      )}

                      {vehicle.notes && (
                        <div className="bg-surface-primary p-3 rounded-md">
                          <p className="text-text-secondary text-sm">
                            <strong>Notes:</strong> {vehicle.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Quick Action */}
                    <div className="mt-4 pt-4 border-t border-border-secondary">
                      <Button
                        variant="outline"
                        fullWidth
                        onClick={() => router.push(`/book?vehicle=${vehicle.id}`)}
                      >
                        Book Service
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deleteModal.isOpen && deleteModal.vehicle && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-surface-secondary rounded-lg p-6 max-w-md mx-4 border border-border-secondary">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-error-600/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-error-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      Delete Vehicle
                    </h3>
                    <p className="text-text-secondary text-sm">
                      This action cannot be undone
                    </p>
                  </div>
                </div>

                <p className="text-text-secondary mb-6">
                  Are you sure you want to delete{' '}
                  <strong className="text-text-primary">
                    {deleteModal.vehicle.make} {deleteModal.vehicle.model}
                  </strong>
                  ? This will not affect your existing bookings, but you'll need to re-enter vehicle details for future bookings.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => setDeleteModal({ isOpen: false, vehicle: null })}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => handleDeleteVehicle(deleteModal.vehicle!.id)}
                  >
                    Delete Vehicle
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Container>
      </CustomerLayout>
    </CustomerRoute>
  )
}