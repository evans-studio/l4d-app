'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Clock, CheckCircle, AlertCircle, XCircle, PlayCircle, Calendar, CreditCard, AlertTriangle } from 'lucide-react'

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors max-w-full min-w-0',
  {
    variants: {
      status: {
        pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        processing: 'bg-blue-100 text-blue-800 border border-blue-200',
        payment_failed: 'bg-red-100 text-red-800 border border-red-200',
        confirmed: 'bg-green-100 text-green-800 border border-green-200',
        rescheduled: 'bg-purple-100 text-purple-800 border border-purple-200',
        in_progress: 'bg-orange-100 text-orange-800 border border-orange-200',
        completed: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        declined: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        cancelled: 'bg-red-100 text-red-800 border border-red-200',
        no_show: 'bg-gray-100 text-gray-800 border border-gray-200'
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-1.5 text-xs',
        lg: 'px-4 py-2 text-sm'
      }
    },
    defaultVariants: {
      status: 'pending',
      size: 'md'
    }
  }
)

export interface StatusBadgeProps extends Omit<VariantProps<typeof statusBadgeVariants>, 'status'> {
  status: 'pending' | 'processing' | 'payment_failed' | 'confirmed' | 'rescheduled' | 'in_progress' | 'completed' | 'declined' | 'cancelled' | 'no_show' | string
  showIcon?: boolean
  className?: string
  truncate?: boolean
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending Payment'
  },
  processing: {
    icon: Clock,
    label: 'Processing Payment'
  },
  payment_failed: {
    icon: XCircle,
    label: 'Payment Failed'
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed'
  },
  rescheduled: {
    icon: Calendar,
    label: 'Rescheduled'
  },
  in_progress: {
    icon: PlayCircle,
    label: 'In Progress'
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed'
  },
  declined: {
    icon: XCircle,
    label: 'Declined'
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled'
  },
  no_show: {
    icon: AlertCircle,
    label: 'No Show'
  }
}

export function StatusBadge({ 
  status, 
  size = 'md', 
  showIcon = true, 
  className = '',
  truncate = true
}: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig]
  const variantStatus = (config ? status : 'pending') as keyof typeof statusConfig
  
  // Size-responsive icon sizing for better alignment
  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5', 
    lg: 'w-4 h-4'
  }[size || 'md'] || 'w-3 h-3'
  
  // Fallback for undefined or unknown status values
  if (!config) {
    const fallbackText = status || 'Unknown'
    return (
      <span 
        className={statusBadgeVariants({ status: 'pending', size, className })}
        title={fallbackText}
      >
        {showIcon && <AlertCircle className={`${iconSize} flex-shrink-0`} />}
        <span className={truncate ? 'truncate' : ''}>{fallbackText}</span>
      </span>
    )
  }

  const Icon = config.icon

  return (
    <span 
      className={statusBadgeVariants({ status: variantStatus, size, className })}
      title={config.label}
    >
      {showIcon && <Icon className={`${iconSize} flex-shrink-0`} />}
      <span className={truncate ? 'truncate' : ''}>{config.label}</span>
    </span>
  )
}

// Payment status badges
export function PaymentStatusBadge({ 
  status, 
  size = 'md',
  className = '' 
}: {
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const paymentConfig = {
    pending: { color: 'yellow', label: 'Payment Pending' },
    paid: { color: 'green', label: 'Paid' },
    failed: { color: 'red', label: 'Payment Failed' },
    refunded: { color: 'gray', label: 'Refunded' }
  }

  const config = paymentConfig[status]
  const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const sizeClasses: Record<string, string> = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs', 
    lg: 'px-4 py-2 text-sm'
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border transition-colors ${colorClasses[config.color]} ${sizeClasses[size]} ${className}`}>
      <CreditCard className="w-3 h-3 flex-shrink-0" />
      {config.label}
    </span>
  )
}

// Payment deadline warning badge
export function PaymentDeadlineBadge({
  deadline,
  className = ''
}: {
  deadline: string
  className?: string
}) {
  const deadlineDate = new Date(deadline)
  const now = new Date()
  const hoursUntilDeadline = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60))
  
  type DeadlineConfig = { color: string; label: string; icon: React.ComponentType<{ className?: string }> }
  let config: DeadlineConfig
  
  if (hoursUntilDeadline <= 0) {
    config = {
      color: 'bg-red-100 text-red-800 border-red-200',
      label: 'Payment Overdue',
      icon: AlertTriangle
    }
  } else if (hoursUntilDeadline <= 24) {
    config = {
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      label: `Due in ${hoursUntilDeadline}h`,
      icon: Clock
    }
  } else {
    config = {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      label: `Due ${deadlineDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
      icon: Clock
    }
  }
  
  const Icon = config.icon
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors ${config.color} ${className}`}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      {config.label}
    </span>
  )
}

// Priority indicator for admin use
export function PriorityBadge({ 
  priority, 
  className = '' 
}: {
  priority: 'low' | 'medium' | 'high' | 'urgent'
  className?: string
}) {
  const priorityConfig = {
    low: { color: 'bg-gray-100 text-gray-700', label: 'Low' },
    medium: { color: 'bg-blue-100 text-blue-700', label: 'Medium' },
    high: { color: 'bg-orange-100 text-orange-700', label: 'High' },
    urgent: { color: 'bg-red-100 text-red-700', label: 'Urgent' }
  }

  const config = priorityConfig[priority]

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.color} ${className}`}>
      {config.label}
    </span>
  )
}