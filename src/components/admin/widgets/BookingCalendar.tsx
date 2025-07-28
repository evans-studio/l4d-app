'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardContent } from '@/components/ui/composites/Card'
import { Button } from '@/components/ui/primitives/Button'
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon,
  ClockIcon,
  UserIcon
} from 'lucide-react'

interface BookingEvent {
  id: string
  title: string
  start: string
  end: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  customerName: string
  serviceName: string
  address?: string
}

interface BookingCalendarProps {
  events: BookingEvent[]
  loading?: boolean
  onEventClick?: (event: BookingEvent) => void
  onDateClick?: (date: Date) => void
}

export function BookingCalendar({
  events,
  loading = false,
  onEventClick,
  onDateClick
}: BookingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('week')

  const getStatusColor = (status: BookingEvent['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    const day = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    startOfWeek.setDate(diff)

    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push(date)
    }
    return days
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start)
      return eventDate.toDateString() === date.toDateString()
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const WeekView = () => {
    const weekDays = getWeekDays()
    
    return (
      <div className="space-y-4">
        {/* Week header */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, index) => (
            <div 
              key={index}
              className={`p-2 text-center text-sm font-medium rounded cursor-pointer transition-colors
                ${day.toDateString() === new Date().toDateString() 
                  ? 'bg-brand-purple text-white' 
                  : 'text-text-secondary hover:bg-surface-hover'
                }`}
              onClick={() => onDateClick?.(day)}
            >
              <div>{day.toLocaleDateString('en-GB', { weekday: 'short' })}</div>
              <div className="text-lg">{day.getDate()}</div>
            </div>
          ))}
        </div>

        {/* Events */}
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {weekDays.map(day => {
            const dayEvents = getEventsForDate(day)
            if (dayEvents.length === 0) return null

            return (
              <div key={day.toISOString()} className="space-y-1">
                <h4 className="text-sm font-medium text-text-primary sticky top-0 bg-surface-primary py-1">
                  {formatDate(day)}
                </h4>
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${getStatusColor(event.status)}`}
                    onClick={() => onEventClick?.(event)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <div className="flex items-center text-xs mt-1 space-x-3">
                          <span className="flex items-center">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {formatTime(event.start)} - {formatTime(event.end)}
                          </span>
                          <span className="flex items-center">
                            <UserIcon className="w-3 h-3 mr-1" />
                            {event.customerName}
                          </span>
                        </div>
                        <p className="text-xs mt-1 opacity-75">{event.serviceName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
          
          {events.length === 0 && (
            <div className="text-center py-8">
              <CalendarIcon className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No bookings scheduled</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const DayView = () => {
    const dayEvents = getEventsForDate(currentDate)
    
    return (
      <div className="space-y-4">
        {/* Day header */}
        <div className="text-center p-4 bg-surface-hover rounded-lg">
          <h3 className="text-lg font-semibold text-text-primary">
            {currentDate.toLocaleDateString('en-GB', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          <p className="text-text-secondary text-sm mt-1">
            {dayEvents.length} booking{dayEvents.length !== 1 ? 's' : ''} scheduled
          </p>
        </div>

        {/* Timeline */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {dayEvents.length === 0 ? (
            <div className="text-center py-12">
              <CalendarIcon className="w-16 h-16 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">No bookings for this day</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => onDateClick?.(currentDate)}
              >
                Add Booking
              </Button>
            </div>
          ) : (
            dayEvents
              .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
              .map(event => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${getStatusColor(event.status)}`}
                  onClick={() => onEventClick?.(event)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{event.title}</h4>
                      <div className="flex items-center text-sm mt-2 space-x-4">
                        <span className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </span>
                        <span className="flex items-center">
                          <UserIcon className="w-4 h-4 mr-1" />
                          {event.customerName}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{event.serviceName}</p>
                      {event.address && (
                        <p className="text-xs text-opacity-75 mt-1">{event.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-text-primary">Booking Calendar</h3>
            <div className="flex items-center space-x-1">
              <Button
                variant={view === 'day' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('day')}
              >
                Day
              </Button>
              <Button
                variant={view === 'week' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Week
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
            >
              Prev
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
              onClick={() => navigateDate('next')}
              rightIcon={<ChevronRightIcon className="w-4 h-4" />}
            >
              Next
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ) : view === 'day' ? (
          <DayView />
        ) : (
          <WeekView />
        )}
      </CardContent>
    </Card>
  )
}