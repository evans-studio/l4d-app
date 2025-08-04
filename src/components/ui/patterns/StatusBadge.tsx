'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Clock, CheckCircle, AlertCircle, XCircle, PlayCircle, Calendar } from 'lucide-react'

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors max-w-full min-w-0',
  {
    variants: {
      status: {
        draft: 'bg-gray-100 text-gray-800 border border-gray-200',
        pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
        rescheduled: 'bg-purple-100 text-purple-800 border border-purple-200',
        in_progress: 'bg-orange-100 text-orange-800 border border-orange-200',
        completed: 'bg-green-100 text-green-800 border border-green-200',
        paid: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        cancelled: 'bg-red-100 text-red-800 border border-red-200',
        declined: 'bg-gray-100 text-gray-800 border border-gray-200',
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
  status: 'draft' | 'pending' | 'confirmed' | 'rescheduled' | 'in_progress' | 'completed' | 'paid' | 'cancelled' | 'declined' | 'no_show' | string
  showIcon?: boolean
  className?: string
  truncate?: boolean
}

const statusConfig = {
  draft: {
    icon: Clock,
    label: 'Draft'
  },
  pending: {
    icon: Clock,
    label: 'Pending Confirmation'
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
  paid: {
    icon: CheckCircle,
    label: 'Paid'
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled'
  },
  declined: {
    icon: XCircle,
    label: 'Declined'
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
      className={statusBadgeVariants({ status: status as any, size, className })}
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