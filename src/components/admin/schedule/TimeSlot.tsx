'use client'

import { useState } from 'react'
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

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const getStatusInfo = () => {
    if (slot.booking) {
      const status = slot.booking.status
      switch (status) {
        case 'completed':
          return {
            icon: CheckCircleIcon,
            text: 'Completed',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200',
            textColor: 'text-purple-800',
            iconColor: 'text-purple-600'
          }
        case 'cancelled':
          return {
            icon: XIcon,
            text: 'Cancelled',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-800',
            iconColor: 'text-red-600'
          }
        case 'confirmed':
        case 'in_progress':
          return {
            icon: UserIcon,
            text: status === 'in_progress' ? 'In Progress' : 'Confirmed',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            textColor: 'text-blue-800',
            iconColor: 'text-blue-600'
          }
        default: // pending, draft
          return {
            icon: ClockIcon,
            text: 'Pending',
            bgColor: 'bg-yellow-50',
            borderColor: 'border-yellow-200',
            textColor: 'text-yellow-800',
            iconColor: 'text-yellow-600'
          }
      }
    } else if (slot.is_available) {
      return {
        icon: CheckCircleIcon,
        text: 'Available',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
        iconColor: 'text-green-600'
      }
    } else {
      return {
        icon: CircleIcon,
        text: 'Blocked',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        textColor: 'text-gray-600',
        iconColor: 'text-gray-500'
      }
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

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <div 
      className={`relative rounded-lg border transition-all duration-200 ${
        isPast 
          ? 'cursor-not-allowed opacity-60' 
          : 'cursor-pointer hover:shadow-sm'
      } ${statusInfo.bgColor} ${statusInfo.borderColor}`}
      onClick={isPast ? undefined : onClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {/* Time Display */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${statusInfo.bgColor} border ${statusInfo.borderColor}`}>
              <StatusIcon className={`w-4 h-4 ${statusInfo.iconColor}`} />
            </div>
            
            <div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="text-lg font-semibold bg-white border border-gray-300 rounded px-2 py-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={handleSaveEdit}
                    className="p-1 text-green-600 hover:bg-green-100 rounded"
                  >
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className={`text-lg font-semibold ${statusInfo.textColor}`}>
                    {formatTime(slot.start_time)}
                  </div>
                  {slot.booking && (
                    <div className="text-sm text-gray-600">
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
              <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase">
                Past
              </span>
            )}
            <span className={`text-sm font-medium ${statusInfo.textColor}`}>
              {statusInfo.text}
            </span>
            
            {!isPast && !isEditing && (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowActions(!showActions)
                  }}
                  className={`p-1 rounded hover:bg-white/50 ${statusInfo.textColor}`}
                >
                  <MoreHorizontalIcon className="w-4 h-4" />
                </button>

                {/* Action Menu */}
                {showActions && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                    <div className="py-1">
                      {!slot.booking && (
                        <button
                          onClick={handleToggleAvailability}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          {slot.is_available ? (
                            <>
                              <EyeOffIcon className="w-4 h-4" />
                              Block
                            </>
                          ) : (
                            <>
                              <EyeIcon className="w-4 h-4" />
                              Unblock
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={handleEdit}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <EditIcon className="w-4 h-4" />
                        Edit Time
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2"
                      >
                        <TrashIcon className="w-4 h-4" />
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
          <div className={`mt-3 pt-3 border-t ${statusInfo.borderColor}`}>
            <div className={`text-sm ${statusInfo.textColor}`}>
              <div className="font-medium">{slot.booking.booking_reference}</div>
              {slot.booking.services.length > 0 && (
                <div>{slot.booking.services.map(s => s.name).join(', ')}</div>
              )}
              <div className="font-medium">£{slot.booking.total_price}</div>
            </div>
          </div>
        )}

        {/* Click hint */}
        {!isPast && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            Tap for details
          </div>
        )}
      </div>

      {/* Click overlay to close actions */}
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