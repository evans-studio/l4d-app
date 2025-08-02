'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Badge } from '@/components/ui/primitives/Badge'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { 
  Car, 
  Edit,
  Trash2,
  Star,
  Calendar,
  Gauge
} from 'lucide-react'

interface VehicleCardProps {
  vehicle: {
    id: string
    make: string
    model: string
    year: number
    color: string
    license_plate?: string
    vehicle_size?: {
      size: 'S' | 'M' | 'L' | 'XL'
      multiplier: number
    }
    vehicle_size_id?: string
    is_primary: boolean
    is_default: boolean
    last_used?: string
    booking_count?: number
  }
  variant?: 'compact' | 'detailed'
  showActions?: boolean
  onEdit?: (vehicle: any) => void
  onDelete?: (vehicleId: string) => void
  onSetDefault?: (vehicleId: string) => void
}

const sizeConfig = {
  S: { label: 'Small', color: 'text-green-600', examples: 'Hatchbacks, Mini' },
  M: { label: 'Medium', color: 'text-blue-600', examples: 'Saloons, Compact SUVs' },
  L: { label: 'Large', color: 'text-orange-600', examples: 'Estates, Large SUVs' },
  XL: { label: 'Extra Large', color: 'text-red-600', examples: 'Vans, Luxury Cars' }
} as const

export function VehicleCard({ 
  vehicle, 
  variant = 'detailed', 
  showActions = true,
  onEdit,
  onDelete,
  onSetDefault
}: VehicleCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSettingDefault, setIsSettingDefault] = useState(false)
  
  // Handle cases where vehicle_size might be undefined (after vehicle_sizes table removal)
  const vehicleSize = vehicle.vehicle_size?.size || 'M' // Default to Medium if no size info
  const sizeInfo = sizeConfig[vehicleSize]

  const formatLastUsed = (dateString?: string) => {
    if (!dateString) return 'Never used'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Used yesterday'
    if (diffDays < 7) return `Used ${diffDays} days ago`
    if (diffDays < 30) return `Used ${Math.floor(diffDays / 7)} weeks ago`
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(vehicle.id)
    } catch (error) {
      console.error('Delete failed:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSetDefault = async () => {
    if (!onSetDefault) return
    setIsSettingDefault(true)
    try {
      await onSetDefault(vehicle.id)
    } catch (error) {
      console.error('Set default failed:', error)
    } finally {
      setIsSettingDefault(false)
    }
  }

  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Vehicle Icon */}
            <div className="w-12 h-12 rounded-lg bg-brand-600/10 flex items-center justify-center flex-shrink-0">
              <Car className="w-6 h-6 text-brand-400" />
            </div>

            {/* Vehicle Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-text-primary truncate">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h3>
                {vehicle.is_default && (
                  <Badge variant="primary" size="sm">
                    <Star className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span className={sizeInfo.color}>Size {vehicleSize}</span>
                <span>•</span>
                <span>{vehicle.color}</span>
                {vehicle.license_plate && (
                  <>
                    <span>•</span>
                    <span>{vehicle.license_plate}</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {showActions && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(vehicle)}
                  className="p-2"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg bg-brand-600/10 flex items-center justify-center">
                  <Car className="w-8 h-8 text-brand-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-text-primary">
                      {vehicle.year} {vehicle.make}
                    </h3>
                    {vehicle.is_default && (
                      <Badge variant="primary">
                        <Star className="w-3 h-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-lg text-text-secondary">{vehicle.model}</p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Size Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">
                    {sizeInfo.label} ({vehicleSize})
                  </p>
                  <p className="text-sm text-text-secondary">
                    {vehicle.vehicle_size?.multiplier || 1.0}x price multiplier
                  </p>
                </div>
              </div>

              {/* Color & Registration */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center">
                  <Car className="w-5 h-5 text-text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-text-primary">{vehicle.color}</p>
                  {vehicle.license_plate && (
                    <p className="text-sm text-text-secondary font-mono">
                      {vehicle.license_plate}
                    </p>
                  )}
                </div>
              </div>

              {/* Usage Stats */}
              {(vehicle.last_used || vehicle.booking_count) && (
                <div className="flex items-center gap-3 sm:col-span-2">
                  <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      {formatLastUsed(vehicle.last_used)}
                    </p>
                    {vehicle.booking_count && (
                      <p className="text-sm text-text-secondary">
                        Used in {vehicle.booking_count} booking{vehicle.booking_count > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Size Examples */}
            <div className="bg-surface-tertiary rounded-lg p-3">
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
                {sizeInfo.label} Vehicle Examples
              </p>
              <p className="text-sm text-text-primary">{sizeInfo.examples}</p>
            </div>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex flex-row lg:flex-col gap-2 lg:min-w-[140px]">
              <Button
                onClick={() => onEdit?.(vehicle)}
                variant="outline"
                size="sm"
                leftIcon={<Edit className="w-4 h-4" />}
                className="flex-1 lg:w-full"
              >
                Edit Vehicle
              </Button>
              
              {!vehicle.is_default && (
                <Button
                  onClick={handleSetDefault}
                  variant="outline"
                  size="sm"
                  disabled={isSettingDefault}
                  leftIcon={isSettingDefault ? 
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" /> :
                    <Star className="w-4 h-4" />
                  }
                  className="flex-1 lg:w-full"
                >
                  {isSettingDefault ? 'Setting...' : 'Set Default'}
                </Button>
              )}
              
              <Button
                onClick={handleDelete}
                variant="outline"
                size="sm"
                disabled={isDeleting || vehicle.is_default}
                leftIcon={isDeleting ? 
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-error-400 border-t-transparent" /> :
                  <Trash2 className="w-4 h-4" />
                }
                className="flex-1 lg:w-full text-error-600 hover:text-error-700 hover:border-error-300"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}