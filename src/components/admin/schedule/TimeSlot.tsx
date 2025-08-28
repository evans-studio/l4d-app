'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/primitives/Button'
import { 
  CheckCircleIcon,
  CircleIcon,
  UserIcon,
  ClockIcon,
  MoreHorizontalIcon,
  EyeIcon,
  EyeOffIcon,
  EditIcon,
  TrashIcon,
  XIcon,
  CheckIcon
} from 'lucide-react'
import { isNewUIEnabled } from '@/lib/config/feature-flags'

interface TimeSlotData {
  id: string
  slot_date: string
  start_time: string
  is_available: boolean
  notes: string | null
  created_at: string
  booking?: {
    id: string
    booking_reference: string
    customer_id: string
    status: string
    scheduled_date: string
    scheduled_start_time: string
    scheduled_end_time: string
    total_price: number
    special_instructions: string | null
    customer_name: string | null
    customer_email: string | null
    customer_phone: string | null
    services: Array<{
      name: string
      description: string | null
    }>
  }
}

interface TimeSlotProps {
  slot: TimeSlotData
  onClick: () => void
  onUpdate: (updates: Partial<TimeSlotData>) => void
  onDelete: () => void
  isPast: boolean
}

export function TimeSlot({ slot, onClick, onUpdate, onDelete, isPast }: TimeSlotProps) {
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTime, setEditTime] = useState(slot.start_time)
  const menuButtonRef = useRef<HTMLButtonElement | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; openUp?: boolean }>({ top: 0, left: 0, openUp: false })

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const getStatusInfo = () => {
    if (slot.booking) {
      return {
        icon: UserIcon,
        text: 'Booked',
        chipBg: 'bg-[var(--primary)]/10',
        chipText: 'text-[var(--primary)]',
        chipBorder: 'border-[var(--primary)]/20'
      }
    }
    if (slot.is_available) {
      return {
        icon: CheckCircleIcon,
        text: 'Available',
        chipBg: 'bg-[var(--surface-secondary)]',
        chipText: 'text-[var(--text-secondary)]',
        chipBorder: 'border-[var(--border-secondary)]'
      }
    }
    // Neutral blocked state (no red/green)
    return {
      icon: CircleIcon,
      text: 'Blocked',
      chipBg: 'bg-[var(--surface-secondary)]',
      chipText: 'text-[var(--text-secondary)]',
      chipBorder: 'border-[var(--border-secondary)]'
    }
  }

  const handleToggleAvailability = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!slot.booking) {
      onUpdate({ is_available: !slot.is_available })
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setShowActions(false)
  }

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdate({ start_time: editTime })
    setIsEditing(false)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditTime(slot.start_time)
    setIsEditing(false)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete()
    setShowActions(false)
  }

  // Position the actions menu via fixed coordinates to avoid clipping within containers
  useEffect(() => {
    if (showActions && menuButtonRef.current) {
      const rect = menuButtonRef.current.getBoundingClientRect()
      const estimatedMenuWidth = 200
      const estimatedMenuHeight = 180
      const margin = 8
      let left = Math.min(window.innerWidth - estimatedMenuWidth - margin, Math.max(margin, rect.right - estimatedMenuWidth))
      let top = rect.bottom + margin
      let openUp = false
      if (window.innerHeight - rect.bottom < estimatedMenuHeight + margin) {
        // Not enough space below, open upwards
        top = rect.top - margin
        openUp = true
      }
      setMenuPos({ top, left, openUp })
    }
  }, [showActions])

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <div 
      className={`relative rounded-lg border transition-all duration-200 ${
        isPast 
          ? 'opacity-60' 
          : 'hover:shadow-sm'
      } bg-[var(--surface-primary)] border-[var(--border-secondary)]`}
      data-ui={isNewUIEnabled() ? 'new' : 'old'}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Time Display */}
          <div className="flex items-center gap-3">
            <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.chipBg} ${statusInfo.chipBorder} ${statusInfo.chipText}`}>
              {statusInfo.text}
            </div>
            
            <div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="text-lg font-semibold bg-[var(--surface-primary)] border border-[var(--border-secondary)] rounded px-2 py-1 text-[var(--text-primary)]"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className={`text-lg font-semibold text-[var(--text-primary)]`}>
                    {formatTime(slot.start_time)}
                  </div>
                  {slot.booking && (
                    <div className="text-sm text-[var(--text-secondary)]">
                      {slot.booking.customer_name}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            {isPast && (
              <span className="text-xs font-bold bg-[var(--surface-secondary)] text-[var(--text-secondary)] px-2 py-1 rounded uppercase">
                Past
              </span>
            )}
            
            {!isPast && !isEditing && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowActions((v) => !v)
                  }}
                  className={`p-1 rounded hover:bg-[var(--surface-hover)] text-[var(--text-secondary)]`}
                  ref={menuButtonRef}
                >
                  <MoreHorizontalIcon className="w-4 h-4" />
                </button>

                {/* Action Menu */}
                {showActions && (
                  <div
                    className="fixed bg-[var(--surface-primary)] border border-[var(--border-secondary)] rounded-lg shadow-lg z-50 min-w-[200px]"
                    style={{ top: menuPos.openUp ? undefined : menuPos.top, bottom: menuPos.openUp ? (window.innerHeight - menuPos.top) : undefined, left: menuPos.left }}
                  >
                    <div className="py-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); onClick(); setShowActions(false) }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-hover)] text-[var(--text-primary)]"
                      >
                        View Details
                      </button>
                      {!slot.booking && (
                        <button
                          onClick={handleToggleAvailability}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-hover)] text-[var(--text-primary)]"
                        >
                          {slot.is_available ? 'Block' : 'Unblock'}
                        </button>
                      )}
                      <button
                        onClick={handleEdit}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-hover)] text-[var(--text-primary)]"
                      >
                        Edit Time
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--surface-hover)] text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Booking Preview */}
        {slot.booking && (
          <div className={`mt-3 pt-3 border-t border-[var(--border-secondary)]`}>
            <div className={`text-sm text-[var(--text-secondary)]`}>
              <div className="font-medium">{slot.booking.booking_reference}</div>
              {slot.booking.services && slot.booking.services.length > 0 && (
                <div>{slot.booking.services.map(s => s.name).join(', ')}</div>
              )}
              <div className="font-medium">£{slot.booking.total_price}</div>
            </div>
          </div>
        )}

        {/* Click hint removed per design clean-up */}
      </div>

      {/* Overlay to close actions */}
      {showActions && (
        <div
          className="fixed inset-0 z-0"
          onClick={(e) => {
            e.stopPropagation()
            setShowActions(false)
          }}
        />
      )}
    </div>
  )
}