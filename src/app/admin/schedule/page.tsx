'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/primitives/Button'
import { 
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
  CheckIcon,
  EyeIcon,
  EyeOffIcon
} from 'lucide-react'

interface TimeSlot {
  id: string
  slot_date: string
  start_time: string
  is_available: boolean
  created_by: string | null
  notes: string | null
  created_at: string
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
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [editingSlot, setEditingSlot] = useState<string | null>(null)
  const [newSlotTime, setNewSlotTime] = useState('09:00')
  const [editSlotTime, setEditSlotTime] = useState('')

  useEffect(() => {
    loadTimeSlots()
  }, [currentDate])

  const loadTimeSlots = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/time-slots')
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTimeSlots(data.data || [])
        }
      }
    } catch (error) {
      console.error('Error loading time slots:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createTimeSlot = async (date: string, time: string) => {
    try {
      const response = await fetch('/api/admin/time-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_date: date,
          start_time: time,
          is_available: true
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setTimeSlots(prev => [...prev, ...data.data])
          setNewSlotTime('09:00')
          setSelectedDate(null)
        }
      }
    } catch (error) {
      console.error('Error creating time slot:', error)
    }
  }

  const updateTimeSlot = async (slotId: string, updates: Partial<TimeSlot>) => {
    try {
      const response = await fetch(`/api/admin/time-slots/${slotId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTimeSlots(prev => 
            prev.map(slot => 
              slot.id === slotId ? { ...slot, ...updates } : slot
            )
          )
          setEditingSlot(null)
          setEditSlotTime('')
        }
      }
    } catch (error) {
      console.error('Error updating time slot:', error)
    }
  }

  const deleteTimeSlot = async (slotId: string) => {
    if (!confirm('Delete this time slot?')) return

    try {
      const response = await fetch(`/api/admin/time-slots/${slotId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setTimeSlots(prev => prev.filter(slot => slot.id !== slotId))
        }
      }
    } catch (error) {
      console.error('Error deleting time slot:', error)
    }
  }

  const toggleSlotAvailability = async (slotId: string, currentAvailability: boolean) => {
    await updateTimeSlot(slotId, { is_available: !currentAvailability })
  }

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const today = new Date()
    
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDayOfMonth.getDay()
    
    const days: CalendarDay[] = []
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(firstDayOfMonth)
      date.setDate(date.getDate() - (i + 1))
      const dateStr = date.toISOString().split('T')[0]!
      
      days.push({
        date: dateStr,
        day: date.getDate(),
        isCurrentMonth: false,
        isToday: false,
        slots: timeSlots.filter(slot => slot.slot_date === dateStr)
      })
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(year, month, day)
      const dateStr = date.toISOString().split('T')[0]!
      const isToday = dateStr === today.toISOString().split('T')[0]!
      
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: true,
        isToday,
        slots: timeSlots.filter(slot => slot.slot_date === dateStr)
      })
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day)
      const dateStr = date.toISOString().split('T')[0]!
      
      days.push({
        date: dateStr,
        day,
        isCurrentMonth: false,
        isToday: false,
        slots: timeSlots.filter(slot => slot.slot_date === dateStr)
      })
    }
    
    return days
  }

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours || '0')
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes || '00'} ${ampm}`
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
    setSelectedDate(null) // Close any open add forms when navigating
  }

  const monthYear = currentDate.toLocaleDateString('en-GB', { 
    month: 'long', 
    year: 'numeric' 
  })

  const calendarDays = generateCalendarDays()
  const isPastDate = (dateStr: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(dateStr) < today
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Schedule Management</h1>
          <p className="text-text-secondary mt-1">
            Manage your available booking slots
          </p>
        </div>

        {/* Quick Stats - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 text-center">
            <div className="text-2xl font-bold text-text-primary">{timeSlots.length}</div>
            <div className="text-xs sm:text-sm text-text-secondary">Total Slots</div>
          </div>
          <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {timeSlots.filter(s => s.is_available).length}
            </div>
            <div className="text-xs sm:text-sm text-text-secondary">Available</div>
          </div>
          <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {timeSlots.filter(s => !s.is_available).length}
            </div>
            <div className="text-xs sm:text-sm text-text-secondary">Blocked</div>
          </div>
          <div className="bg-surface-secondary rounded-xl border border-border-primary p-4 text-center">
            <div className="text-2xl font-bold text-text-primary">
              {timeSlots.filter(s => {
                const slotDate = new Date(s.slot_date)
                return slotDate.getMonth() === currentDate.getMonth() && 
                       slotDate.getFullYear() === currentDate.getFullYear()
              }).length}
            </div>
            <div className="text-xs sm:text-sm text-text-secondary">This Month</div>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-surface-secondary rounded-xl border border-border-primary overflow-hidden">
          {/* Calendar Header */}
          <div className="bg-surface-primary border-b border-border-secondary p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-semibold text-text-primary flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                {monthYear}
              </h2>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="px-2 sm:px-3"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">Prev</span>
                </Button>
                <Button
                  variant="outline" 
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="px-2 sm:px-3"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-2 sm:p-4">
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Day Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-medium text-text-secondary text-xs sm:text-sm">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}

              {/* Calendar Days */}
              {calendarDays.map((calendarDay, index) => {
                const isSelected = selectedDate === calendarDay.date
                const isPast = isPastDate(calendarDay.date)
                
                return (
                  <div
                    key={index}
                    className={`min-h-[80px] sm:min-h-[120px] border rounded-lg p-1 sm:p-2 transition-all duration-200 ${
                      calendarDay.isCurrentMonth 
                        ? 'bg-surface-primary border-border-secondary' 
                        : 'bg-surface-tertiary border-border-tertiary opacity-50'
                    } ${
                      calendarDay.isToday 
                        ? 'ring-2 ring-brand-600 border-brand-300' 
                        : ''
                    } ${
                      isSelected 
                        ? 'bg-brand-50 border-brand-400 shadow-sm' 
                        : ''
                    } ${
                      isPast && calendarDay.isCurrentMonth
                        ? 'opacity-40'
                        : ''
                    }`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <span className={`text-xs sm:text-sm font-medium ${
                        calendarDay.isToday 
                          ? 'text-brand-600 font-bold' 
                          : calendarDay.isCurrentMonth 
                            ? 'text-text-primary' 
                            : 'text-text-muted'
                      }`}>
                        {calendarDay.day}
                      </span>
                      {calendarDay.isCurrentMonth && !isPast && (
                        <button
                          onClick={() => setSelectedDate(isSelected ? null : calendarDay.date)}
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all hover:scale-110 ${
                            isSelected 
                              ? 'bg-brand-600 border-brand-600 text-white' 
                              : 'border-border-primary bg-surface-secondary text-text-muted hover:border-brand-400 hover:text-brand-600'
                          }`}
                        >
                          {isSelected ? <XIcon className="w-3 h-3" /> : <PlusIcon className="w-3 h-3" />}
                        </button>
                      )}
                    </div>

                    {/* Time Slots */}
                    <div className="space-y-1">
                      {calendarDay.slots
                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                        .map(slot => (
                          <div
                            key={slot.id}
                            className={`text-xs rounded-md px-1.5 py-1 transition-all ${
                              slot.is_available
                                ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {editingSlot === slot.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="time"
                                  value={editSlotTime}
                                  onChange={(e) => setEditSlotTime(e.target.value)}
                                  className="text-xs bg-transparent border-0 p-0 w-full min-w-0"
                                  autoFocus
                                />
                                <button
                                  onClick={() => updateTimeSlot(slot.id, { start_time: editSlotTime })}
                                  className="text-green-600 hover:text-green-700 p-0.5"
                                >
                                  <CheckIcon className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingSlot(null)
                                    setEditSlotTime('')
                                  }}
                                  className="text-gray-600 hover:text-gray-700 p-0.5"
                                >
                                  <XIcon className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between group">
                                <button
                                  onClick={() => toggleSlotAvailability(slot.id, slot.is_available)}
                                  className="flex-1 text-left font-medium"
                                  title={slot.is_available ? 'Click to block' : 'Click to make available'}
                                >
                                  <span className="hidden sm:inline">{formatTime(slot.start_time)}</span>
                                  <span className="sm:hidden">{slot.start_time}</span>
                                </button>
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => toggleSlotAvailability(slot.id, slot.is_available)}
                                    className={`p-0.5 rounded hover:bg-white/20 ${
                                      slot.is_available ? 'text-green-700' : 'text-gray-500'
                                    }`}
                                    title={slot.is_available ? 'Block slot' : 'Make available'}
                                  >
                                    {slot.is_available ? <EyeIcon className="w-3 h-3" /> : <EyeOffIcon className="w-3 h-3" />}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingSlot(slot.id)
                                      setEditSlotTime(slot.start_time)
                                    }}
                                    className="p-0.5 rounded hover:bg-white/20 text-blue-600"
                                    title="Edit time"
                                  >
                                    <EditIcon className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteTimeSlot(slot.id)}
                                    className="p-0.5 rounded hover:bg-white/20 text-red-600"
                                    title="Delete slot"
                                  >
                                    <TrashIcon className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                      {/* Add New Slot Form */}
                      {isSelected && (
                        <div className="bg-brand-100 border border-brand-300 rounded-md p-1.5 animate-fadeIn">
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-3 h-3 text-brand-600 flex-shrink-0" />
                            <input
                              type="time"
                              value={newSlotTime}
                              onChange={(e) => setNewSlotTime(e.target.value)}
                              className="text-xs border border-brand-300 rounded px-1 py-0.5 flex-1 min-w-0 bg-white"
                              autoFocus
                            />
                            <button
                              onClick={() => createTimeSlot(calendarDay.date, newSlotTime)}
                              className="p-0.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded"
                              title="Add slot"
                            >
                              <CheckIcon className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setSelectedDate(null)}
                              className="p-0.5 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded"
                              title="Cancel"
                            >
                              <XIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Usage Guide - Mobile Optimized */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
          <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            Quick Guide
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-blue-700 text-sm">
            <div className="flex items-center gap-2">
              <PlusIcon className="w-4 h-4 flex-shrink-0" />
              <span>Tap <strong>+</strong> to add time slots</span>
            </div>
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 flex-shrink-0" />
              <span>Tap slots to toggle availability</span>
            </div>
            <div className="flex items-center gap-2">
              <EditIcon className="w-4 h-4 flex-shrink-0" />
              <span>Hover and tap edit to change time</span>
            </div>
            <div className="flex items-center gap-2">
              <TrashIcon className="w-4 h-4 flex-shrink-0" />
              <span>Hover and tap trash to delete</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
                <span>Available for booking</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
                <span>Blocked/Unavailable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
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