'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { logger } from '@/lib/utils/logger'
import {
  type BookingStatus,
  validateTransition,
  getStatusLabel
} from '@/lib/utils/status-transitions'
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
  currentStatus: BookingStatus
  onStatusUpdate: (newStatus: string) => void
  customerEmail?: string
  customerPhone?: string
}

const statusFlow: Partial<Record<BookingStatus, Array<keyof typeof actionConfig>>> = {
  pending: ['confirmed', 'cancelled'],
  processing: ['confirmed', 'cancelled'],
  payment_failed: ['cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  rescheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  declined: [],
  cancelled: [],
  no_show: []
}

const statusConfig: Partial<Record<BookingStatus, {
  label: string
  color: string
  bgColor: string
  icon: typeof CheckCircleIcon
}>> = {
  pending: {
    label: 'Pending Confirmation',
    color: 'text-[var(--warning)]',
    bgColor: 'bg-[var(--warning-bg)]',
    icon: ClockIcon
  },
  processing: {
    label: 'Processing Payment',
    color: 'text-[var(--info)]',
    bgColor: 'bg-[var(--info-bg)]',
    icon: ClockIcon
  },
  payment_failed: {
    label: 'Payment Failed',
    color: 'text-[var(--error)]',
    bgColor: 'bg-[var(--error-bg)]',
    icon: AlertCircleIcon
  },
  confirmed: {
    label: 'Confirmed',
    color: 'text-[var(--success)]',
    bgColor: 'bg-[var(--success-bg)]',
    icon: CheckCircleIcon
  },
  rescheduled: {
    label: 'Rescheduled',
    color: 'text-[var(--info)]',
    bgColor: 'bg-[var(--info-bg)]',
    icon: AlertCircleIcon
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
  declined: {
    label: 'Declined',
    color: 'text-[var(--warning)]',
    bgColor: 'bg-[var(--warning-bg)]',
    icon: AlertCircleIcon
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-[var(--error)]',
    bgColor: 'bg-[var(--error-bg)]',
    icon: XIcon
  },
  no_show: {
    label: 'No Show',
    color: 'text-[var(--text-muted)]',
    bgColor: 'bg-[var(--surface-tertiary)]',
    icon: AlertCircleIcon
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

  // Admin override controls
  const ALL_STATUSES: BookingStatus[] = [
    'pending',
    'processing',
    'payment_failed',
    'confirmed',
    'rescheduled',
    'in_progress',
    'completed',
    'declined',
    'cancelled',
    'no_show'
  ]
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideStatus, setOverrideStatus] = useState<BookingStatus | ''>('')
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideNotes, setOverrideNotes] = useState('')
  const [forceOverride, setForceOverride] = useState(false)

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
      logger.error('Failed to update status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleOverrideUpdate = async () => {
    if (!overrideStatus) return
    // Validate transition for admin awareness (backend permits; this is for UX)
    const validation = validateTransition(currentStatus, overrideStatus)
    if (!validation.valid && !forceOverride) {
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: overrideStatus,
          reason: overrideReason || `Admin override to ${overrideStatus}`,
          notes: overrideNotes
        })
      })

      const data = await response.json()
      if (data.success) {
        onStatusUpdate(overrideStatus)
        setOverrideReason('')
        setOverrideNotes('')
        setForceOverride(false)
        setOverrideStatus('')
        setOverrideOpen(false)
      }
    } catch (error) {
      logger.error('Failed to override status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const currentConfig = statusConfig[currentStatus] || {
    label: getStatusLabel(currentStatus),
    color: 'text-[var(--text-primary)]',
    bgColor: 'bg-[var(--surface-tertiary)]',
    icon: AlertCircleIcon
  }
  const CurrentIcon = currentConfig.icon
  const availableActions = (statusFlow[currentStatus] || []) as Array<keyof typeof actionConfig>

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
            {availableActions.map((action: keyof typeof actionConfig) => {
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

      {/* Admin Override */}
      <div className="mt-6 pt-4 border-t border-[var(--border-secondary)]">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-[var(--text-primary)]">Admin Override</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOverrideOpen((v) => !v)}
          >
            {overrideOpen ? 'Hide' : 'Show'} Override
          </Button>
        </div>

        {overrideOpen && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Select status</label>
                <select
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] focus:border-[var(--input-border-focus)] focus:outline-none"
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as BookingStatus)}
                >
                  <option value="">Choose…</option>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {getStatusLabel(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Why are you changing this status?"
                  className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">Notes (optional)</label>
              <textarea
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-[var(--input-border-focus)] focus:outline-none resize-none"
              />
            </div>

            {/* Validation feedback */}
            {overrideStatus && (
              <ValidationBanner fromStatus={currentStatus} toStatus={overrideStatus} force={forceOverride} onToggleForce={setForceOverride} />
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleOverrideUpdate}
                variant="primary"
                size="sm"
                disabled={isUpdating || !overrideStatus || (!validateTransition(currentStatus, overrideStatus).valid && !forceOverride)}
              >
                {isUpdating ? 'Updating…' : 'Apply Override'}
              </Button>
              <Button
                onClick={() => {
                  setOverrideStatus('')
                  setOverrideReason('')
                  setOverrideNotes('')
                  setForceOverride(false)
                }}
                variant="outline"
                size="sm"
              >
                Reset
              </Button>
            </div>
          </div>
        )}
      </div>

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

// Inline validation banner for admin awareness
function ValidationBanner({
  fromStatus,
  toStatus,
  force,
  onToggleForce
}: {
  fromStatus: BookingStatus
  toStatus: BookingStatus
  force: boolean
  onToggleForce: (v: boolean) => void
}) {
  const v = validateTransition(fromStatus, toStatus)
  if (v.valid && !v.warning) return null

  return (
    <div className="p-3 rounded-md border text-sm"
      style={{
        backgroundColor: 'var(--surface-tertiary)',
        borderColor: 'var(--border-secondary)',
        color: 'var(--text-secondary)'
      }}
    >
      {!v.valid && (
        <p className="mb-2">{v.reason || 'This transition is not normally allowed.'}</p>
      )}
      {v.warning && (
        <p className="mb-2">{v.warning}</p>
      )}
      {(!v.valid || v.requiresConfirmation) && (
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => onToggleForce(e.target.checked)}
          />
          <span>Force override (bypass validation)</span>
        </label>
      )}
    </div>
  )
}