'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { ScheduleSwiper } from '@/components/admin/schedule/ScheduleSwiper'
import { Button } from '@/components/ui/primitives/Button'
import { 
  CalendarIcon,
  ClockIcon,
  ToggleLeftIcon,
  ToggleRightIcon
} from 'lucide-react'

interface TimeSlot {
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

interface CalendarDay {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  slots: TimeSlot[]
}

function ScheduleCalendarContent() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'swipe' | 'calendar'>('swipe')

  useEffect(() => {
    loadTimeSlots()
  }, [])

  const loadTimeSlots = async () => {
    try {
      setIsLoading(true)
      
      // Add date range to ensure we get recent slots
      const today = new Date()
      const pastDate = new Date(today)
      pastDate.setDate(today.getDate() - 30) // 30 days ago
      
      const futureDate = new Date(today)
      futureDate.setDate(today.getDate() + 60) // 60 days ahead
      
      const startDate = pastDate.toISOString().split('T')[0]
      const endDate = futureDate.toISOString().split('T')[0]
      
      const url = `/api/admin/time-slots?start=${startDate}&end=${endDate}&excludePast=true&_ts=${Date.now()}`
      
      const response = await fetch(url, { cache: 'no-store' })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          
          setTimeSlots(data.data || [])
        } else {
          console.error('API returned error:', data.error)
        }
      } else {
        console.error('HTTP error:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error loading time slots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'swipe' ? 'calendar' : 'swipe')
  }

  return (
    <AdminLayout>
      <div className="relative max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--surface-primary)]/60 backdrop-blur-[1px] rounded-xl">
            <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Schedule Management
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">
              Manage your available booking slots
            </p>
          </div>
          
          {/* Calendar toggle removed per request */}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-primary)] p-4 text-center">
            <div className="text-2xl font-bold text-[var(--text-primary)]">{timeSlots.length}</div>
            <div className="text-xs sm:text-sm text-[var(--text-secondary)]">Total Slots</div>
          </div>
          <div className="bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-primary)] p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {timeSlots.filter(s => s.is_available && !s.booking).length}
            </div>
            <div className="text-xs sm:text-sm text-[var(--text-secondary)]">Available</div>
          </div>
          <div className="bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-primary)] p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {timeSlots.filter(s => !s.is_available && !s.booking).length}
            </div>
            <div className="text-xs sm:text-sm text-[var(--text-secondary)]">Blocked</div>
          </div>
          <div className="bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-primary)] p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {timeSlots.filter(s => !!s.booking).length}
            </div>
            <div className="text-xs sm:text-sm text-[var(--text-secondary)]">Booked</div>
          </div>
        </div>

        {/* Main Content */}
        {viewMode === 'swipe' ? (
          <ScheduleSwiper
            timeSlots={timeSlots}
            onSlotsChange={loadTimeSlots}
            isLoading={isLoading}
          />
        ) : (
          <div className="bg-[var(--surface-secondary)] rounded-xl border border-[var(--border-primary)] p-6 text-center">
            <CalendarIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
              Calendar View Coming Soon
            </h3>
            <p className="text-[var(--text-secondary)] mb-4">
              The traditional calendar view is being updated to work with the new system.
            </p>
            <Button onClick={toggleViewMode} size="sm">
              <ToggleLeftIcon className="w-4 h-4 mr-2" />
              Switch to Card View
            </Button>
          </div>
        )}

        {/* Quick Guide removed per request */}
      </div>
    </AdminLayout>
  )
}

export default function ScheduleManagementPage() {
  return (
    <AdminRoute>
      <ScheduleCalendarContent />
    </AdminRoute>
  )
}