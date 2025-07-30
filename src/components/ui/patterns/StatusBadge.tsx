'use client'

import { cva, type VariantProps } from 'class-variance-authority'
import { Clock, CheckCircle, AlertCircle, XCircle, PlayCircle, Calendar } from 'lucide-react'

const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
  {
    variants: {
      status: {
        pending: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        confirmed: 'bg-blue-100 text-blue-800 border border-blue-200',
        rescheduled: 'bg-purple-100 text-purple-800 border border-purple-200',
        in_progress: 'bg-orange-100 text-orange-800 border border-orange-200',
        completed: 'bg-green-100 text-green-800 border border-green-200',
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

export interface StatusBadgeProps extends VariantProps<typeof statusBadgeVariants> {
  status: 'pending' | 'confirmed' | 'rescheduled' | 'in_progress' | 'completed' | 'cancelled' | 'declined' | 'no_show'
  showIcon?: boolean
  className?: string
}

const statusConfig = {
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
  size, 
  showIcon = true, 
  className = '' 
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span className={statusBadgeVariants({ status, size, className })}>
      {showIcon && <Icon className="w-3 h-3" />}
      {config.label}
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