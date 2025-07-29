'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/primitives/Button'
import { 
  CalendarIcon, 
  PlusIcon, 
  ClockIcon, 
  EditIcon, 
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react'
import { TimeSlotModal } from '@/components/admin/TimeSlotModal'
import { BulkScheduleModal } from '@/components/admin/BulkScheduleModal'

interface TimeSlot {
  id: string
  slot_date: string
  start_time: string
  is_available: boolean
  notes?: string
  booking_id?: string
  customer_name?: string
  service_name?: string
}

interface ScheduleStats {
  totalSlots: number
  availableSlots: number
  bookedSlots: number
  revenue: number
}

function AdminSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [stats, setStats] = useState<ScheduleStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')

  const loadScheduleData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      // Get week start and end dates
      const weekStart = getWeekStart(currentDate)
      const weekEnd = getWeekEnd(currentDate)
      
      const [slotsResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/time-slots?start=${weekStart}&end=${weekEnd}`),
        fetch(`/api/admin/schedule/stats?start=${weekStart}&end=${weekEnd}`)
      ])

      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json()
        if (slotsData.success) {
          setTimeSlots(slotsData.data)
        }
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        if (statsData.success) {
          setStats(statsData.data)
        }
      }
    } catch (error) {
      console.error('Failed to load schedule data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    loadScheduleData()
  }, [currentDate, loadScheduleData])

  const getWeekStart = (date: Date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday start
    start.setDate(diff)
    return start.toISOString().split('T')[0]
  }

  const getWeekEnd = (date: Date) => {
    const end = new Date(date)
    const day = end.getDay()
    const diff = end.getDate() - day + (day === 0 ? 0 : 7) // Sunday end
    end.setDate(diff)
    return end.toISOString().split('T')[0]
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentDate(newDate)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const getWeekDays = () => {
    const weekStartStr = getWeekStart(currentDate)
    if (!weekStartStr) return []
    
    const weekStart = new Date(weekStartStr)
    const days = []
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + i)
      days.push(day.toISOString().split('T')[0])
    }
    
    return days
  }

  const getSlotsForDate = (date: string) => {
    return timeSlots.filter(slot => slot.slot_date === date)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  const handleCreateSlot = (date: string) => {
    setSelectedDate(date)
    setShowCreateModal(true)
  }

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Are you sure you want to delete this time slot?')) return

    try {
      const response = await fetch(`/api/admin/time-slots/${slotId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadScheduleData()
      }
    } catch (error) {
      console.error('Failed to delete time slot:', error)
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-purple"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Schedule Management</h1>
            <p className="text-text-secondary mt-2">
              Manage your availability and time slots for bookings
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowBulkModal(true)}
              leftIcon={<CalendarIcon className="w-4 h-4" />}
            >
              Bulk Create
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface-secondary rounded-lg border border-border-primary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Total Slots</p>
                  <p className="text-xl font-bold text-text-primary">{stats.totalSlots}</p>
                </div>
                <CalendarIcon className="w-6 h-6 text-brand-purple" />
              </div>
            </div>

            <div className="bg-surface-secondary rounded-lg border border-border-primary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Available</p>
                  <p className="text-xl font-bold text-green-600">{stats.availableSlots}</p>
                </div>
                <ClockIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>

            <div className="bg-surface-secondary rounded-lg border border-border-primary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Booked</p>
                  <p className="text-xl font-bold text-blue-600">{stats.bookedSlots}</p>
                </div>
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-surface-secondary rounded-lg border border-border-primary p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-text-secondary text-sm">Week Revenue</p>
                  <p className="text-xl font-bold text-text-primary">£{stats.revenue}</p>
                </div>
                <CalendarIcon className="w-6 h-6 text-brand-purple" />
              </div>
            </div>
          </div>
        )}

        {/* Calendar Navigation */}
        <div className="bg-surface-secondary rounded-lg border border-border-primary p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Week of {formatDate(getWeekStart(currentDate) || '')}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
                leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
                rightIcon={<ChevronRightIcon className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Weekly Calendar Grid */}
          <div className="grid grid-cols-7 gap-4">
            {getWeekDays().map((date) => {
              if (!date) return null
              
              const daySlots = getSlotsForDate(date)
              const today = new Date().toISOString().split('T')[0]
              const isToday = date === today
              const isPast = new Date(date) < new Date(today || '')
              
              return (
                <div key={date} className={`border rounded-lg p-3 min-h-[200px] ${
                  isToday ? 'border-brand-400 bg-brand-50' : 'border-border-secondary bg-surface-primary'
                } ${isPast ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-text-primary text-sm">
                        {formatDate(date)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {daySlots.length} slots
                      </p>
                    </div>
                    {!isPast && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCreateSlot(date)}
                        className="p-1"
                      >
                        <PlusIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {daySlots.map(slot => (
                      <div
                        key={slot.id}
                        className={`p-2 rounded text-xs ${
                          slot.booking_id
                            ? 'bg-blue-100 border border-blue-200 text-blue-800'
                            : 'bg-green-100 border border-green-200 text-green-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {formatTime(slot.start_time)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0.5 h-auto"
                              onClick={() => {/* TODO: Edit slot */}}
                            >
                              <EditIcon className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-0.5 h-auto text-red-600"
                              onClick={() => handleDeleteSlot(slot.id)}
                            >
                              <TrashIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {slot.booking_id && (
                          <div className="mt-1">
                            <p className="truncate">{slot.customer_name}</p>
                            <p className="truncate text-xs opacity-75">{slot.service_name}</p>
                          </div>
                        )}
                        {slot.notes && (
                          <p className="mt-1 text-xs opacity-75 truncate">{slot.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Create Time Slot Modal */}
      <TimeSlotModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        selectedDate={selectedDate}
        onSuccess={loadScheduleData}
      />

      {/* Bulk Schedule Creation Modal */}
      <BulkScheduleModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={loadScheduleData}
      />
    </AdminLayout>
  )
}

export default function AdminSchedulePageWithProtection() {
  return (
    <AdminRoute>
      <AdminSchedulePage />
    </AdminRoute>
  )
}