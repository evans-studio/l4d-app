'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { AdminRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/primitives/Button'
import { EventCalendar, type CalendarEvent } from '@/components/event-calendar'
import { QuickViewDialog } from '@/components/ui/overlays/modals/QuickViewDialog'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
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
  const router = useRouter()
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  // Only EventCalendar is used; legacy views removed
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null)
  const [loadingBooking, setLoadingBooking] = useState(false)

  useEffect(() => {
    loadTimeSlots()
  }, [])

  const loadTimeSlots = async () => {
    try {
      setIsLoading(true)
      
      // Add date range to ensure we get recent slots
      const today = new Date()
      const pastDate = new Date(today)
      pastDate.setDate(today.getDate() - 30) // 30 days ago (can adjust via query later)
      
      const futureDate = new Date(today)
      futureDate.setDate(today.getDate() + 180) // 180 days ahead
      
      const startDate = pastDate.toISOString().split('T')[0]
      const endDate = futureDate.toISOString().split('T')[0]
      
      const url = `/api/admin/time-slots?start=${startDate}&end=${endDate}&excludePast=false&_ts=${Date.now()}`
      
      const response = await fetch(url, { cache: 'no-store' })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const slots: TimeSlot[] = data.data || []
          setTimeSlots(slots)
          const mapped: CalendarEvent[] = slots.map(s => {
            const start = new Date(`${s.slot_date}T${s.start_time}`)
            const end = new Date(start.getTime() + 60 * 60 * 1000)
            return {
              id: s.id,
              title: s.booking ? 'Booked' : (s.is_available ? 'Available' : 'Blocked'),
              start,
              end,
              allDay: false,
              color: s.booking ? 'rose' : (s.is_available ? 'emerald' : 'orange'),
              meta: s
            }
          })
          setEvents(mapped)
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

  const openBookingModal = async (bookingId: string) => {
    try {
      setSelectedBookingId(bookingId)
      setBookingModalOpen(true)
      setLoadingBooking(true)
      const res = await fetch(`/api/bookings/${bookingId}`)
      const json = await res.json()
      if (json?.success) setSelectedBooking(json.data)
    } finally {
      setLoadingBooking(false)
    }
  }

  // Legacy toggle removed

  return (
    <AdminLayout>
      <div className="relative max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[var(--surface-primary)]/60 backdrop-blur-[1px] rounded-xl">
            <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
          </div>
        )}
        {/* Header */}
        <div className="space-y-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Schedule</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
                Schedule Management
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">
                Manage your available booking slots
              </p>
            </div>
          </div>
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

        {/* Event Calendar - single source of truth for schedule */}
        <div className="space-y-4">
          <EventCalendar
            events={events}
            onEventClick={(ev) => {
              const slot = ev.meta as TimeSlot | undefined
              if (slot?.booking) {
                // Open lightweight modal with booking details
                void openBookingModal(slot.booking.id)
                return true
              }
              return false
            }}
            onEventAdd={async (ev) => {
              await fetch('/api/admin/time-slots', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  slot_date: ev.start.toISOString().slice(0,10),
                  start_time: ev.start.toTimeString().slice(0,5),
                  is_available: true,
                  notes: ev.title || null
                })
              })
              await loadTimeSlots()
            }}
            onEventUpdate={async (ev) => {
              // If event is a booking, open details instead of editing time
              const slot = ev.meta as TimeSlot | undefined
              if (slot?.booking) {
                router.push(`/admin/bookings/${slot.booking.id}`)
                return
              }
              await fetch(`/api/admin/time-slots/${ev.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  slot_date: ev.start.toISOString().slice(0,10),
                  start_time: ev.start.toTimeString().slice(0,5)
                })
              })
              await loadTimeSlots()
            }}
            onEventDelete={async (id) => {
              await fetch(`/api/admin/time-slots/${id}`, { method: 'DELETE' })
              await loadTimeSlots()
            }}
            initialView="month"
          />

          {/* Booking quick-view modal */}
          <QuickViewDialog open={bookingModalOpen} onOpenChange={(o) => { setBookingModalOpen(o); if (!o) { setSelectedBookingId(null); setSelectedBooking(null) } }} title="Booking Details">
              {loadingBooking ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full" />
                </div>
              ) : selectedBooking ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Reference</span>
                    <span className="text-[var(--text-primary)] font-medium">
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(String(selectedBooking.booking_reference))}
                        className="underline-offset-4 hover:underline text-[var(--text-link)] hover:text-[var(--text-link-hover)]"
                        aria-label="Copy booking reference"
                      >
                        #{selectedBooking.booking_reference}
                      </button>
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Customer</span>
                    <span className="text-[var(--text-primary)] font-medium">{selectedBooking.customer_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Date</span>
                    <span className="text-[var(--text-primary)] font-medium">{new Date(selectedBooking.scheduled_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Start</span>
                    <span className="text-[var(--text-primary)] font-medium">{selectedBooking.start_time}</span>
                  </div>
                  {selectedBooking.vehicle && (
                    <div className="pt-2 border-t border-[var(--border-secondary)] text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Vehicle</span>
                        <span className="text-[var(--text-primary)] font-medium">
                          {(selectedBooking.vehicle.year ? selectedBooking.vehicle.year + ' ' : '')}
                          {selectedBooking.vehicle.make} {selectedBooking.vehicle.model}
                        </span>
                      </div>
                      {(selectedBooking.vehicle.color || selectedBooking.vehicle.license_plate) && (
                        <div className="flex justify-between mt-1">
                          <span className="text-[var(--text-secondary)]">Details</span>
                          <span className="text-[var(--text-primary)]">
                            {selectedBooking.vehicle.color || ''}
                            {selectedBooking.vehicle.color && selectedBooking.vehicle.license_plate ? ' • ' : ''}
                            {selectedBooking.vehicle.license_plate ? (
                              <button
                                type="button"
                                onClick={() => navigator.clipboard.writeText(String(selectedBooking.vehicle.license_plate))}
                                className="underline-offset-4 hover:underline text-[var(--text-link)] hover:text-[var(--text-link-hover)]"
                                aria-label="Copy license plate"
                              >
                                {selectedBooking.vehicle.license_plate}
                              </button>
                            ) : null}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedBooking.address && (
                    <div className="pt-2 border-t border-[var(--border-secondary)] text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-secondary)]">Address</span>
                        <span className="text-right text-[var(--text-primary)]">
                          <span className="block font-medium">{selectedBooking.address.address_line_1}</span>
                          {selectedBooking.address.address_line_2 && (
                            <span className="block">{selectedBooking.address.address_line_2}</span>
                          )}
                          <span className="block">{selectedBooking.address.city}, {selectedBooking.address.postal_code}</span>
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button onClick={() => { if (selectedBookingId) router.push(`/admin/bookings/${selectedBookingId}`) }} size="sm">
                      Open full booking
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setBookingModalOpen(false)}>Close</Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[var(--text-secondary)] py-4">Booking not found.</div>
              )}
          </QuickViewDialog>
        </div>

        {/* Legacy views removed */}

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