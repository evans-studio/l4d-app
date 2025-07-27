'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { 
  CheckCircleIcon, 
  XIcon, 
  ClockIcon, 
  AlertCircleIcon,
  MessageSquareIcon,
  PhoneIcon,
  MailIcon
} from 'lucide-react'

interface BookingStatusManagerProps {
  bookingId: string
  currentStatus: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  onStatusUpdate: (newStatus: string) => void
  customerEmail?: string
  customerPhone?: string
}

const statusFlow = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: []
}

const statusConfig = {
  pending: {
    label: 'Pending Confirmation',
    color: 'text-[var(--warning)]',
    bgColor: 'bg-[var(--warning-bg)]',
    icon: ClockIcon
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-[var(--success)]',
    bgColor: 'bg-[var(--success-bg)]',
    icon: CheckCircleIcon
  },
  in_progress: {
    label: 'In Progress',
    color: 'text-[var(--info)]',
    bgColor: 'bg-[var(--info-bg)]',
    icon: AlertCircleIcon
  },
  completed: {
    label: 'Completed',
    color: 'text-[var(--success)]',
    bgColor: 'bg-[var(--success-bg)]',
    icon: CheckCircleIcon
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-[var(--error)]',
    bgColor: 'bg-[var(--error-bg)]',
    icon: XIcon
  }
}

const actionConfig = {
  confirmed: {
    label: 'Confirm Booking',
    description: 'Accept this booking and notify the customer',
    buttonText: 'Confirm',
    buttonVariant: 'primary' as const
  },
  in_progress: {
    label: 'Start Service',
    description: 'Mark this booking as currently in progress',
    buttonText: 'Start Service',
    buttonVariant: 'primary' as const
  },
  completed: {
    label: 'Complete Service',
    description: 'Mark this service as completed',
    buttonText: 'Complete',
    buttonVariant: 'primary' as const
  },
  cancelled: {
    label: 'Cancel Booking',
    description: 'Cancel this booking and notify the customer',
    buttonText: 'Cancel',
    buttonVariant: 'outline' as const
  }
}

export function BookingStatusManager({ 
  bookingId, 
  currentStatus, 
  onStatusUpdate,
  customerEmail,
  customerPhone 
}: BookingStatusManagerProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [statusNotes, setStatusNotes] = useState('')

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          notes: statusNotes
        })
      })

      const data = await response.json()
      if (data.success) {
        onStatusUpdate(newStatus)
        setStatusNotes('')
        setShowNotes(false)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const currentConfig = statusConfig[currentStatus]
  const CurrentIcon = currentConfig.icon
  const availableActions = statusFlow[currentStatus]

  return (
    <div className="bg-[var(--surface-secondary)] rounded-lg p-6 border border-[var(--border-secondary)]">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Booking Status Management
      </h3>

      {/* Current Status */}
      <div className="mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${currentConfig.bgColor}`}>
          <CurrentIcon className={`w-5 h-5 ${currentConfig.color}`} />
          <span className={`font-medium ${currentConfig.color}`}>
            {currentConfig.label}
          </span>
        </div>
      </div>

      {/* Available Actions */}
      {availableActions.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-[var(--text-primary)]">Available Actions</h4>
          
          <div className="grid grid-cols-1 gap-3">
            {availableActions.map((action) => {
              const config = actionConfig[action as keyof typeof actionConfig]
              
              return (
                <div
                  key={action}
                  className="flex items-center justify-between p-4 bg-[var(--surface-tertiary)] rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">
                      {config.label}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {config.description}
                    </p>
                  </div>
                  
                  <Button
                    onClick={() => {
                      if (action === 'cancelled') {
                        setShowNotes(true)
                      } else {
                        handleStatusUpdate(action)
                      }
                    }}
                    variant={config.buttonVariant}
                    size="sm"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Updating...' : config.buttonText}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Status Notes Modal */}
      {showNotes && (
        <div className="mt-6 p-4 bg-[var(--surface-tertiary)] rounded-lg border border-[var(--border-secondary)]">
          <h4 className="font-medium text-[var(--text-primary)] mb-3">
            Add Notes (Optional)
          </h4>
          <textarea
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            placeholder="Add any notes about this status change..."
            rows={3}
            className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none transition-colors resize-none"
          />
          
          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => handleStatusUpdate('cancelled')}
              variant="outline"
              size="sm"
              disabled={isUpdating}
            >
              {isUpdating ? 'Cancelling...' : 'Cancel Booking'}
            </Button>
            <Button
              onClick={() => setShowNotes(false)}
              variant="outline"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Customer Communication */}
      {(customerEmail || customerPhone) && (
        <div className="mt-6 pt-4 border-t border-[var(--border-secondary)]">
          <h4 className="font-medium text-[var(--text-primary)] mb-3">
            Customer Communication
          </h4>
          
          <div className="flex gap-2">
            {customerPhone && (
              <Button
                onClick={() => window.open(`tel:${customerPhone}`)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <PhoneIcon className="w-4 h-4" />
                Call Customer
              </Button>
            )}
            
            {customerEmail && (
              <Button
                onClick={() => window.open(`mailto:${customerEmail}`)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <MailIcon className="w-4 h-4" />
                Send Email
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <MessageSquareIcon className="w-4 h-4" />
              Send SMS
            </Button>
          </div>
        </div>
      )}

      {/* Status History */}
      <div className="mt-6 pt-4 border-t border-[var(--border-secondary)]">
        <h4 className="font-medium text-[var(--text-primary)] mb-3">
          Status History
        </h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between py-2 px-3 bg-[var(--surface-tertiary)] rounded">
            <span className="text-[var(--text-secondary)]">
              Current: {currentConfig.label}
            </span>
            <span className="text-[var(--text-muted)]">
              {new Date().toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}