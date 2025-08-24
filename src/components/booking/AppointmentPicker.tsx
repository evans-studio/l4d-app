'use client'

import { useEffect, useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { eachDayOfInterval } from 'date-fns'
import { isNewUIEnabled } from '@/lib/config/feature-flags'
import { Button as ShadButton } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button as L4DButton } from '@/components/ui/primitives/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/composites/Card'
import { useMultiDateAvailability } from '@/hooks/useRealTimeAvailability'
import { AddSlotModal } from '@/components/admin/schedule/AddSlotModal'

type TimeSlot = {
  id: string
  slot_date: string
  start_time: string
  end_time: string
  is_available: boolean
}

interface AppointmentPickerProps {
  initialDate?: Date
  onSelect: (slot: { id: string; date: string; start: string; end: string }) => void
  adminMode?: boolean
  selectedSlotId?: string
}

export function AppointmentPicker({ initialDate, onSelect, adminMode = false, selectedSlotId }: AppointmentPickerProps) {
  const today = useMemo(() => new Date(), [])
  const [date, setDate] = useState<Date>(initialDate || today)
  const [visibleMonth, setVisibleMonth] = useState<Date>(initialDate ? startOfMonth(initialDate) : startOfMonth(today))
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddSlot, setShowAddSlot] = useState(false)

  const selectedDateIso = format(date, 'yyyy-MM-dd')

  // Build visible month date list
  const monthDates = useMemo(() => {
    const start = startOfMonth(visibleMonth)
    const end = endOfMonth(visibleMonth)
    return eachDayOfInterval({ start, end }).map(d => format(d, 'yyyy-MM-dd'))
  }, [visibleMonth])

  // Pull availability for the visible month to show indicators
  const { availabilityMap } = useMultiDateAvailability(monthDates, 120000)
  const datesWithAvailable = useMemo(() => {
    const s = new Set<string>()
    monthDates.forEach(d => {
      const slots = availabilityMap.get(d) || []
      if (slots.some((sl: any) => sl.is_available)) {
        s.add(d)
      }
    })
    return s
  }, [availabilityMap, monthDates])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/time-slots/availability?date=${selectedDateIso}`)
        const json = await res.json()
        setTimeSlots(json?.data || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [selectedDateIso])

  // Keep visible month in sync with selected date
  useEffect(() => {
    const selMonth = startOfMonth(date)
    if (selMonth.getTime() !== visibleMonth.getTime()) {
      setVisibleMonth(selMonth)
    }
  }, [date, visibleMonth])

  // On mount and when visible month availability changes, ensure selected date is a day with slots
  useEffect(() => {
    if (loading) return
    if (timeSlots.length > 0) return
    const currentIso = selectedDateIso
    const candidates = monthDates.filter(d => datesWithAvailable.has(d))
    if (candidates.length > 0 && !datesWithAvailable.has(currentIso)) {
      const nextIso = candidates[0] as string
      const [y, m, dd] = (nextIso || '').split('-').map(Number)
      if (y && m && dd) {
        const nextDate = new Date(y, m - 1, dd)
        setDate(nextDate)
        setVisibleMonth(startOfMonth(nextDate))
      }
    }
  }, [loading, timeSlots.length, monthDates, datesWithAvailable])


  return (
    <Card data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      <CardHeader className="pb-3">
        <h3 className="text-lg font-semibold">Select date & time</h3>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="flex max-sm:flex-col">
            <Calendar
              key={selectedDateIso}
              mode="single"
              selected={date}
              month={visibleMonth}
              styles={{
                day_selected: { backgroundColor: 'var(--primary)', color: 'var(--primary-foreground, #fff)' },
                day_button: {},
              }}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(newDate)
                }
              }}
              onMonthChange={(m: Date) => setVisibleMonth(startOfMonth(m))}
              className="p-2 sm:pe-5"
              disabled={[{ before: today }]}
              modifiers={{
                hasSlots: (day: Date) => datesWithAvailable.has(format(day, 'yyyy-MM-dd')),
                selected: (day: Date) => format(day, 'yyyy-MM-dd') === selectedDateIso
              }}
              modifiersClassNames={{
                hasSlots: 'after:absolute after:bottom-1 after:h-1.5 after:w-1.5 after:bg-[var(--primary)] after:rounded-full after:content-[\'\']',
                selected: 'bg-[var(--primary)] text-white'
              }}
              classNames={{
                // Make selected day more clearly active and tone down today's dot
                day_button: 'group-data-selected:bg-[var(--primary)] group-data-selected:text-white group-data-selected:ring-0',
                today: 'after:bg-[var(--border-secondary)] [&[data-selected]>*]:after:bg-transparent',
                day_selected: 'bg-[var(--primary)] text-white',
                day: 'group size-9 px-0 py-px text-sm [&[aria-selected=true]_.rdp-day_button]:bg-[var(--primary)] [&[aria-selected=true]_.rdp-day_button]:text-white'
              }}
            />
            <div className="relative w-full max-sm:h-48 sm:w-48">
              <div className="absolute inset-0 py-4 max-sm:border-t">
                <ScrollArea className="h-full sm:border-s">
                  <div className="space-y-3">
                    <div className="flex h-5 shrink-0 items-center px-5">
                      <p className="text-sm font-medium">
                        {format(date, 'EEEE, d')}
                      </p>
                    </div>
                    {adminMode && (
                      <div className="px-5">
                        {isNewUIEnabled() ? (
                          <ShadButton size="sm" onClick={() => setShowAddSlot(true)} className="w-full">Add Slot</ShadButton>
                        ) : (
                          <L4DButton size="md" onClick={() => setShowAddSlot(true)} fullWidth>
                            Add Slot
                          </L4DButton>
                        )}
                      </div>
                    )}
                    <div className="grid gap-1.5 px-5 max-sm:grid-cols-2">
                      {loading && (
                        <div className="text-sm text-muted-foreground">Loading…</div>
                      )}
                      {!loading && timeSlots.length === 0 && (
                        <div className="text-sm text-muted-foreground">No slots</div>
                      )}
                      {timeSlots.map((slot) => (
                        isNewUIEnabled() ? (
                          <ShadButton
                            key={slot.id}
                            variant={slot.is_available ? (selectedSlotId === slot.id ? 'default' : 'outline') : 'outline'}
                            size="sm"
                            className="w-full justify-center"
                            onClick={() =>
                              slot.is_available &&
                              onSelect({ id: slot.id, date: slot.slot_date, start: slot.start_time, end: slot.end_time })
                            }
                            disabled={!slot.is_available}
                          >
                            <span className="w-full text-center">{slot.start_time}</span>
                          </ShadButton>
                        ) : (
                          <L4DButton
                            key={slot.id}
                            variant={slot.is_available ? (selectedSlotId === slot.id ? 'primary' : 'outline') : 'outline'}
                            size="md"
                            className="w-full justify-center"
                            onClick={() =>
                              slot.is_available &&
                              onSelect({ id: slot.id, date: slot.slot_date, start: slot.start_time, end: slot.end_time })
                            }
                            disabled={!slot.is_available}
                          >
                            <span className="w-full text-center">{slot.start_time}</span>
                          </L4DButton>
                        )
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
        </div>
        {adminMode && showAddSlot && (
          <AddSlotModal
            date={selectedDateIso}
            onClose={() => setShowAddSlot(false)}
            onSuccess={async () => {
              setShowAddSlot(false)
              const res = await fetch(`/api/time-slots/availability?date=${selectedDateIso}`)
              const json = await res.json()
              setTimeSlots(json?.data || [])
            }}
          />
        )}
      </CardContent>
    </Card>
  )
}

export default AppointmentPicker


