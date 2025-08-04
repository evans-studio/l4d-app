'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { Badge } from '@/components/ui/primitives/Badge'
import { Card, CardContent } from '@/components/ui/composites/Card'
import { 
  MapPin, 
  Edit,
  Trash2,
  Star,
  Calendar,
  Navigation,
  Clock
} from 'lucide-react'

interface AddressCardProps {
  address: {
    id: string
    address_line_1: string
    address_line_2?: string
    city: string
    county?: string
    postal_code: string
    country: string
    distance_from_business?: number
    is_primary: boolean
    is_default: boolean
    last_used?: string
    booking_count?: number
  }
  variant?: 'compact' | 'detailed'
  showActions?: boolean
  onEdit?: (address: any) => void
  onDelete?: (addressId: string) => void
  onSetDefault?: (addressId: string) => void
}

export function AddressCard({ 
  address, 
  variant = 'detailed', 
  showActions = true,
  onEdit,
  onDelete,
  onSetDefault
}: AddressCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSettingDefault, setIsSettingDefault] = useState(false)

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

  const formatDistance = (distance?: number) => {
    if (!distance) return null
    
    const roundedDistance = Math.round(distance * 10) / 10
    const isFree = distance <= 17.5
    
    return {
      distance: roundedDistance,
      isFree,
      label: `${roundedDistance} miles from business`,
      surchargeInfo: isFree ? 'Free service area' : 'Travel surcharge applies'
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(address.id)
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
      await onSetDefault(address.id)
    } catch (error) {
      console.error('Set default failed:', error)
    } finally {
      setIsSettingDefault(false)
    }
  }

  const distanceInfo = formatDistance(address.distance_from_business)

  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Address Icon */}
            <div className="w-12 h-12 rounded-lg bg-brand-600/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-6 h-6 text-brand-400" />
            </div>

            {/* Address Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-text-primary truncate">
                  {address.address_line_1}
                </h3>
                {address.is_default && (
                  <Badge variant="primary" size="sm">
                    <Star className="w-3 h-3 mr-1" />
                    Default
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                <span>{address.city}, {address.postal_code}</span>
                {distanceInfo && (
                  <>
                    <span>•</span>
                    <span className={distanceInfo.isFree ? 'text-success-600' : 'text-warning-600'}>
                      {distanceInfo.distance} miles
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {showActions && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => onEdit?.(address)}
                  className="min-h-[44px] min-w-[44px] p-2 touch-manipulation flex items-center justify-center"
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
                  <MapPin className="w-8 h-8 text-brand-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-semibold text-text-primary">
                      {address.address_line_1}
                    </h3>
                    {address.is_default && (
                      <Badge variant="primary">
                        <Star className="w-3 h-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                  <p className="text-text-secondary">
                    {address.address_line_2 && `${address.address_line_2}, `}
                    {address.city}, {address.postal_code}
                  </p>
                </div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Distance Info */}
              {distanceInfo && (
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    distanceInfo.isFree ? 'bg-success-600/10' : 'bg-warning-600/10'
                  }`}>
                    <Navigation className={`w-5 h-5 ${
                      distanceInfo.isFree ? 'text-success-400' : 'text-warning-400'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      {distanceInfo.label}
                    </p>
                    <p className={`text-sm ${
                      distanceInfo.isFree ? 'text-success-600' : 'text-warning-600'
                    }`}>
                      {distanceInfo.surchargeInfo}
                    </p>
                  </div>
                </div>
              )}

              {/* Usage Stats */}
              {(address.last_used || address.booking_count) && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">
                      {formatLastUsed(address.last_used)}
                    </p>
                    {address.booking_count && (
                      <p className="text-sm text-text-secondary">
                        Used in {address.booking_count} booking{address.booking_count > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Service Area Info */}
            {distanceInfo && (
              <div className={`rounded-lg p-3 ${
                distanceInfo.isFree 
                  ? 'bg-success-600/10 border border-success-200' 
                  : 'bg-warning-600/10 border border-warning-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  <Navigation className={`w-4 h-4 ${
                    distanceInfo.isFree ? 'text-success-600' : 'text-warning-600'
                  }`} />
                  <p className={`text-sm font-medium ${
                    distanceInfo.isFree ? 'text-success-700' : 'text-warning-700'
                  }`}>
                    {distanceInfo.isFree ? 'Free Service Area' : 'Travel Surcharge Area'}
                  </p>
                </div>
                <p className={`text-xs ${
                  distanceInfo.isFree ? 'text-success-600' : 'text-warning-600'
                }`}>
                  {distanceInfo.isFree 
                    ? 'No additional charges for this location'
                    : `£0.50 per mile beyond 17.5 miles (£${Math.max(5, Math.min(25, Math.round((distanceInfo.distance - 17.5) * 0.5 * 100) / 100))} estimated surcharge)`
                  }
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:min-w-[160px]">
              <Button
                onClick={() => onEdit?.(address)}
                variant="outline"
                size="md"
                leftIcon={<Edit className="w-4 h-4" />}
                className="w-full min-h-[44px] touch-manipulation"
              >
                Edit Address
              </Button>
              
              {!address.is_default && (
                <Button
                  onClick={handleSetDefault}
                  variant="outline"
                  size="md"
                  disabled={isSettingDefault}
                  leftIcon={isSettingDefault ? 
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" /> :
                    <Star className="w-4 h-4" />
                  }
                  className="w-full min-h-[44px] touch-manipulation"
                >
                  {isSettingDefault ? 'Setting...' : 'Set Default'}
                </Button>
              )}
              
              <Button
                onClick={handleDelete}
                variant="outline"
                size="md"
                disabled={isDeleting || address.is_default}
                leftIcon={isDeleting ? 
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-error-400 border-t-transparent" /> :
                  <Trash2 className="w-4 h-4" />
                }
                className="w-full min-h-[44px] touch-manipulation text-error-600 hover:text-error-700 hover:border-error-300"
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