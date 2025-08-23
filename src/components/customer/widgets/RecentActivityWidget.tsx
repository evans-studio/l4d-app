'use client'

import { useRouter } from 'next/navigation'
import { useOverlay } from '@/lib/overlay/context'
import { Button } from '@/components/ui/primitives/Button'
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/composites/Card'
import { Badge } from '@/components/ui/primitives/Badge'
import { isNewUIEnabled } from '@/lib/config/feature-flags'
import { 
  Activity, 
  Calendar, 
  Car,
  CheckCircle,
  Clock,
  X,
  AlertCircle,
  ChevronRight
} from 'lucide-react'

interface RecentActivityWidgetProps {
  recentBookings: Array<{
    id: string
    booking_reference: string
    scheduled_date: string
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
    service: {
      name: string
      short_description?: string
      category?: string
    } | null
    vehicle: {
      make: string
      model: string
      year?: number
      color?: string
    } | null
    total_price: number
  }>
}

const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    bgColor: 'bg-warning-600/10',
    iconColor: 'text-warning-600',
    badgeColor: 'warning'
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle,
    bgColor: 'bg-success-600/10',
    iconColor: 'text-success-600',
    badgeColor: 'success'
  },
  rescheduled: {
    label: 'Rescheduled',
    icon: Calendar,
    bgColor: 'bg-brand-600/10',
    iconColor: 'text-brand-600',
    badgeColor: 'brand'
  },
  in_progress: {
    label: 'In Progress',
    icon: Activity,
    bgColor: 'bg-brand-600/10',
    iconColor: 'text-brand-600',
    badgeColor: 'brand'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    bgColor: 'bg-success-600/10',
    iconColor: 'text-success-600',
    badgeColor: 'success'
  },
  cancelled: {
    label: 'Cancelled',
    icon: X,
    bgColor: 'bg-error-600/10',
    iconColor: 'text-error-600',
    badgeColor: 'error'
  },
  no_show: {
    label: 'No Show',
    icon: AlertCircle,
    bgColor: 'bg-error-600/10',
    iconColor: 'text-error-600',
    badgeColor: 'error'
  }
} as const

export function RecentActivityWidget({ recentBookings }: RecentActivityWidgetProps) {
  const router = useRouter()
  const { openOverlay } = useOverlay()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    })
  }

  const displayBookings = recentBookings.slice(0, 3)

  if (recentBookings.length === 0) {
    return (
      <Card className="h-full" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
        <CardHeader>
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-400" />
            Recent Activity
          </h3>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <div className="w-12 h-12 rounded-full bg-surface-tertiary flex items-center justify-center mb-4">
            <Activity className="w-6 h-6 text-text-muted" />
          </div>
          <h4 className="font-medium text-text-primary mb-2">No activity yet</h4>
          <p className="text-sm text-text-secondary mb-6 text-center px-4">
            Your booking history will appear here
          </p>
          <Button
            onClick={() => router.push('/book')}
            size="md"
            className="w-full min-h-[48px] touch-manipulation"
            fullWidth
          >
            Book Your First Service
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full" data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-400" />
            Recent Activity
          </h3>
          {recentBookings.length > 3 && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Go to bookings"
              onClick={() => router.push('/dashboard/bookings')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayBookings.map((booking) => {
          const config = statusConfig[booking.status] || statusConfig.pending
          const StatusIcon = config.icon
          
          return (
            <div
              key={booking.id}
              className="flex flex-col gap-4 p-5 rounded-xl bg-surface-tertiary hover:bg-surface-secondary transition-all duration-200 cursor-pointer min-h-[100px] touch-manipulation"
              onClick={() => openOverlay({
                type: 'booking-view',
                data: { bookingId: booking.id, booking }
              })}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Status Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
                    <StatusIcon className={`w-6 h-6 ${config.iconColor}`} />
                  </div>
                  
                  {/* Service Name */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-text-primary text-lg truncate mb-1">
                      {booking.service?.name || 'Service details pending'}
                    </h4>
                  </div>
                </div>

                {/* Price & Status */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-brand-600 text-xl whitespace-nowrap mb-1">
                    £{booking.total_price || 0}
                  </p>
                  <Badge variant={config.badgeColor as any} size="sm">
                    {config.label}
                  </Badge>
                </div>
              </div>

              {/* Details Row */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                <div className="flex items-center gap-3 text-text-secondary">
                  <Car className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">
                    {booking.vehicle ? `${booking.vehicle.year || ''} ${booking.vehicle.make} ${booking.vehicle.model}`.trim() : 'Vehicle details pending'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-text-secondary">
                  <Calendar className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{formatDate(booking.scheduled_date)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>

      {recentBookings.length > 3 && (
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard/bookings')}
            className="w-full min-h-[48px] touch-manipulation"
            fullWidth
          >
            View All Bookings ({recentBookings.length})
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}