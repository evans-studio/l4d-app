'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { isNewUIEnabled } from '@/lib/config/feature-flags'
import { Button as ShadButton } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button as L4DButton } from '@/components/ui/primitives/Button'
import { Card, CardContent, CardHeader } from '@/components/ui/composites/Card'

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
}

export function AppointmentPicker({ initialDate, onSelect }: AppointmentPickerProps) {
  const today = useMemo(() => new Date(), [])
  const [date, setDate] = useState<Date>(initialDate || today)
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(false)

  const selectedDateIso = format(date, 'yyyy-MM-dd')

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


  return (
    <Card data-ui={isNewUIEnabled() ? 'new' : 'old'}>
      <CardHeader className="pb-3">
        <h3 className="text-lg font-semibold">Select date & time</h3>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <div className="flex max-sm:flex-col">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => {
                if (newDate) {
                  setDate(newDate)
                }
              }}
              className="p-2 sm:pe-5"
              disabled={[{ before: today }]}
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
                            variant={slot.is_available ? 'default' : 'outline'}
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              slot.is_available &&
                              onSelect({ id: slot.id, date: slot.slot_date, start: slot.start_time, end: slot.end_time })
                            }
                            disabled={!slot.is_available}
                          >
                            {slot.start_time}
                          </ShadButton>
                        ) : (
                          <L4DButton
                            key={slot.id}
                            variant={slot.is_available ? 'primary' : 'outline'}
                            size="md"
                            className="w-full"
                            onClick={() =>
                              slot.is_available &&
                              onSelect({ id: slot.id, date: slot.slot_date, start: slot.start_time, end: slot.end_time })
                            }
                            disabled={!slot.is_available}
                          >
                            {slot.start_time}
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
      </CardContent>
    </Card>
  )
}

export default AppointmentPicker


