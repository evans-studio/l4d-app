import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Car, 
  User, 
  Phone, 
  Mail,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

// Import our component library
import { Card, CardHeader, CardContent, CardFooter } from '../composites/Card'
import { Button } from '../primitives/Button'
import { Text, Heading } from '../primitives/Typography'
import { Icon, IconButton } from '../primitives/Icon'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

const bookingCardVariants = cva(
  'transition-all duration-300',
  {
    variants: {
      status: {
        draft: 'border-l-4 border-l-[var(--text-muted)]',
        pending: 'border-l-4 border-l-[var(--warning)]',
        confirmed: 'border-l-4 border-l-[var(--success)]',
        in_progress: 'border-l-4 border-l-[var(--primary)]',
        completed: 'border-l-4 border-l-[var(--success)]',
        cancelled: 'border-l-4 border-l-[var(--error)]',
        no_show: 'border-l-4 border-l-[var(--error)]',
      },
      priority: {
        low: '',
        normal: '',
        high: 'ring-2 ring-[var(--warning)]/20',
        urgent: 'ring-2 ring-[var(--error)]/20',
      },
      layout: {
        compact: '',
        detailed: '',
        summary: '',
      },
    },
    defaultVariants: {
      status: 'pending',
      priority: 'normal',
      layout: 'detailed',
    },
  }
)

const statusConfig = {
  draft: {
    icon: Edit,
    label: 'Draft',
    color: 'text-[var(--text-muted)]',
    bgColor: 'bg-[var(--text-muted)]/10',
  },
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-[var(--warning)]',
    bgColor: 'bg-[var(--warning)]/10',
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    color: 'text-[var(--success)]',
    bgColor: 'bg-[var(--success)]/10',
  },
  in_progress: {
    icon: Loader2,
    label: 'In Progress',
    color: 'text-[var(--primary)]',
    bgColor: 'bg-[var(--primary)]/10',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'text-[var(--success)]',
    bgColor: 'bg-[var(--success)]/10',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'text-[var(--error)]',
    bgColor: 'bg-[var(--error)]/10',
  },
  no_show: {
    icon: AlertCircle,
    label: 'No Show',
    color: 'text-[var(--error)]',
    bgColor: 'bg-[var(--error)]/10',
  },
} as const

export interface BookingData {
  id: string
  bookingReference: string
  status: keyof typeof statusConfig
  scheduledDate: string
  scheduledStartTime: string
  scheduledEndTime?: string
  totalPrice: number
  customer: {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
  }
  services: Array<{
    id: string
    name: string
    price: number
  }>
  vehicle?: {
    make: string
    model: string
    year?: number
    color?: string
    size?: string
  }
  address?: {
    addressLine1: string
    addressLine2?: string
    city: string
    postalCode: string
  }
  specialInstructions?: string
  createdAt: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

export interface BookingCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bookingCardVariants> {
  booking: BookingData
  layout?: 'compact' | 'detailed' | 'summary'
  showActions?: boolean
  onView?: (booking: BookingData) => void
  onEdit?: (booking: BookingData) => void
  onCancel?: (booking: BookingData) => void
  onConfirm?: (booking: BookingData) => void
  confirmLabel?: string
  loading?: boolean
  interactive?: boolean
}

const BookingCard = React.forwardRef<HTMLDivElement, BookingCardProps>(
  ({
    className,
    booking,
    status: statusProp = booking.status,
    priority = booking.priority || 'normal',
    layout = 'detailed',
    showActions = true,
    onView,
    onEdit,
    onCancel,
    onConfirm,
    confirmLabel,
    loading = false,
    interactive = false,
    ...props
  }, ref) => {
    const status = statusProp || 'pending'
    const statusInfo = statusConfig[status]
    const StatusIcon = statusInfo.icon
    
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    }
    
    const formatTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':')
      const hour = parseInt(hours || '0')
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes || '00'} ${ampm}`
    }
    
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: 'GBP'
      }).format(price)
    }
    
    // Map layout to Card size variants for consistency
    const cardSize = {
      compact: 'sm' as const,  // p-4
      detailed: 'md' as const, // p-6  
      summary: 'sm' as const,  // p-4
    }[layout]
    
    const handleCardClick = () => {
      if (interactive && onView) {
        onView(booking)
      }
    }
    
    return (
      <Card
        ref={ref}
        size={cardSize}
        className={cn(
          bookingCardVariants({ status, priority, layout }),
          interactive && 'cursor-pointer hover:shadow-md',
          className
        )}
        variant={interactive ? 'interactive' : 'default'}
        clickable={interactive}
        onClick={handleCardClick}
        data-ui={isNewUIEnabled() ? 'new' : 'old'}
        {...props}
      >
        {/* Header: Status, Reference, Actions */}
        <CardHeader layout="compact">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Status Badge */}
              <div className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                statusInfo.bgColor,
                statusInfo.color
              )}>
                <Icon
                  icon={StatusIcon}
                  size="xs"
                  className={cn(
                    status === 'in_progress' && 'animate-spin'
                  )}
                  decorative
                />
                <span className="hidden sm:inline">{statusInfo.label}</span>
              </div>
              
              {/* Booking Reference */}
              <div className="flex-1 min-w-0">
                <Text 
                  size="sm" 
                  weight="medium" 
                  color="primary"
                  className="truncate"
                >
                  #{booking.bookingReference}
                </Text>
                <Text 
                  size="xs" 
                  color="muted"
                  className="hidden sm:block"
                >
                  {formatDate(booking.createdAt)}
                </Text>
              </div>
            </div>
            
            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {onView && (
                  <IconButton
                    icon={Eye}
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onView(booking)
                    }}
                    aria-label="View booking"
                    disabled={loading}
                  />
                )}
                {onEdit && status !== 'completed' && status !== 'cancelled' && (
                  <IconButton
                    icon={Edit}
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(booking)
                    }}
                    aria-label="Edit booking"
                    disabled={loading}
                  />
                )}
                {onCancel && status !== 'completed' && status !== 'cancelled' && (
                  <IconButton
                    icon={Trash2}
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCancel(booking)
                    }}
                    aria-label="Cancel booking"
                    disabled={loading}
                    className="text-[var(--error)] hover:text-[var(--error)]"
                  />
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent spacing={layout === 'compact' ? 'sm' : 'md'}>
          {/* Main Details Grid */}
          <div className={cn(
            'grid gap-4',
            layout === 'detailed' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
          )}>
            {/* Date & Time */}
            <div className="flex items-center gap-3">
              <Icon
                icon={Calendar}
                size="sm"
                color="muted"
                decorative
              />
              <div className="flex-1 min-w-0">
                <Text size="sm" weight="medium" className="truncate">
                  {formatDate(booking.scheduledDate)}
                </Text>
                <Text size="xs" color="muted">
                  {formatTime(booking.scheduledStartTime)}
                  {booking.scheduledEndTime && ` - ${formatTime(booking.scheduledEndTime)}`}
                </Text>
              </div>
            </div>
            
            {/* Customer */}
            <div className="flex items-center gap-3">
              <Icon
                icon={User}
                size="sm"
                color="muted"
                decorative
              />
              <div className="flex-1 min-w-0">
                <Text size="sm" weight="medium" className="break-words line-clamp-1 sm:truncate">
                  {booking.customer.firstName} {booking.customer.lastName}
                </Text>
                {booking.customer.phone && (
                  <Text size="xs" color="muted" className="break-all sm:truncate">
                    {booking.customer.phone}
                  </Text>
                )}
              </div>
            </div>
            
            {/* Price */}
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-[var(--success)]/10 flex items-center justify-center">
                <Text size="xs" weight="bold" color="success">
                  £
                </Text>
              </div>
              <div>
                <Text size="sm" weight="bold" color="success">
                  {formatPrice(booking.totalPrice)}
                </Text>
                <Text size="xs" color="muted">
                  Total
                </Text>
              </div>
            </div>
          </div>
          
          {/* Vehicle Info */}
          {booking.vehicle && layout !== 'compact' && (
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--border-secondary)]">
              <Icon
                icon={Car}
                size="sm"
                color="muted"
                decorative
              />
              <div className="flex-1 min-w-0">
                <Text size="sm" weight="medium" className="break-words line-clamp-1 sm:truncate">
                  {booking.vehicle.year && `${booking.vehicle.year} `}
                  {booking.vehicle.make} {booking.vehicle.model}
                </Text>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  {booking.vehicle.color && <span>{booking.vehicle.color}</span>}
                  {booking.vehicle.size && (
                    <>
                      {booking.vehicle.color && <span>•</span>}
                      <span>{booking.vehicle.size} Size</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Address */}
          {booking.address && layout === 'detailed' && (
            <div className="flex items-start gap-3 mt-4 pt-4 border-t border-[var(--border-secondary)]">
              <Icon
                icon={MapPin}
                size="sm"
                color="muted"
                decorative
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <Text size="sm" className="break-words line-clamp-1 sm:truncate">
                  {booking.address.addressLine1}
                </Text>
                {booking.address.addressLine2 && (
                  <Text size="sm" className="break-words line-clamp-1 sm:truncate">
                    {booking.address.addressLine2}
                  </Text>
                )}
                <Text size="xs" color="muted" className="break-words">
                  {booking.address.city}, {booking.address.postalCode}
                </Text>
              </div>
            </div>
          )}
          
          {/* Services */}
          {layout === 'detailed' && (
            <div className="mt-4 pt-4 border-t border-[var(--border-secondary)]">
              <Text size="sm" weight="medium" className="mb-2">
                Services ({booking.services.length})
              </Text>
              <div className="space-y-1">
                {booking.services.map((service, index) => (
                  <div key={service.id} className="flex justify-between items-center">
                    <Text size="sm" className="break-words line-clamp-1 sm:truncate">
                      {service.name}
                    </Text>
                    <Text size="sm" weight="medium">
                      {formatPrice(service.price)}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Special Instructions */}
          {booking.specialInstructions && layout === 'detailed' && (
            <div className="mt-4 pt-4 border-t border-[var(--border-secondary)]">
              <Text size="sm" weight="medium" className="mb-1">
                Special Instructions
              </Text>
              <Text size="sm" color="secondary" className="line-clamp-2">
                {booking.specialInstructions}
              </Text>
            </div>
          )}
        </CardContent>
        
        {/* Footer: Action Buttons */}
        {showActions && (onConfirm || status === 'pending') && (
          <CardFooter layout="compact" direction="row" justify="end">
            <div className="flex gap-2 w-full sm:w-auto">
              {status === 'pending' && onConfirm && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onConfirm(booking)
                  }}
                  loading={loading}
                  fullWidth
                  className="sm:w-auto"
                >
                  {confirmLabel || 'Confirm Booking'}
                </Button>
              )}
              
              {status === 'confirmed' && (
                <div className="flex items-center gap-2 text-[var(--success)] text-sm">
                  <Icon icon={CheckCircle} size="sm" decorative />
                  <span className="hidden sm:inline">Ready for service</span>
                  <span className="sm:hidden">Ready</span>
                </div>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    )
  }
)
BookingCard.displayName = 'BookingCard'

// Booking Card Skeleton
export const BookingCardSkeleton: React.FC<{ layout?: 'compact' | 'detailed' | 'summary' }> = ({ 
  layout = 'detailed' 
}) => {
  return (
    <Card className="animate-pulse">
      <CardHeader layout="compact">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-16 bg-[var(--surface-secondary)] rounded-full" />
            <div className="h-4 w-24 bg-[var(--surface-secondary)] rounded" />
          </div>
          <div className="flex gap-1">
            <div className="h-8 w-8 bg-[var(--surface-secondary)] rounded-md" />
            <div className="h-8 w-8 bg-[var(--surface-secondary)] rounded-md" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className={cn(
          'grid gap-4',
          layout === 'detailed' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
        )}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-5 w-5 bg-[var(--surface-secondary)] rounded" />
              <div className="space-y-1 flex-1">
                <div className="h-4 bg-[var(--surface-secondary)] rounded w-3/4" />
                <div className="h-3 bg-[var(--surface-secondary)] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
        
        {layout === 'detailed' && (
          <>
            <div className="mt-4 pt-4 border-t border-[var(--border-secondary)]">
              <div className="h-4 bg-[var(--surface-secondary)] rounded w-1/4 mb-2" />
              <div className="space-y-2">
                <div className="h-3 bg-[var(--surface-secondary)] rounded" />
                <div className="h-3 bg-[var(--surface-secondary)] rounded w-2/3" />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export { BookingCard, bookingCardVariants, statusConfig }