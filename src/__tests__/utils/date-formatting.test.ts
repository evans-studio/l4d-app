import { formatDate, formatTime, formatDateForEmail, formatTimeForEmail, getSlotStartTime, calculateEndTime } from '@/lib/utils/date-formatting'

describe('date-formatting utils', () => {
  describe('formatDate', () => {
    it('formats ISO date yyyy-MM-dd', () => {
      expect(formatDate('2024-01-15')).toMatch(/Tuesday, January 15, 2024|Monday, January 15, 2024|Wednesday, January 15, 2024/)
    })

    it('returns fallback when invalid', () => {
      expect(formatDate('invalid-date')).toBe('Invalid date')
      expect(formatDate(undefined)).toBe('Date not available')
    })
  })

  describe('formatTime', () => {
    it('formats 24h HH:mm to h:mm AM/PM', () => {
      expect(formatTime('00:05')).toBe('12:05 AM')
      expect(formatTime('12:30')).toBe('12:30 PM')
      expect(formatTime('23:59')).toBe('11:59 PM')
    })

    it('returns fallback when invalid', () => {
      expect(formatTime('99:99')).toBe('Invalid time')
      expect(formatTime(undefined)).toBe('Time not available')
    })
  })

  describe('email variants', () => {
    it('formats date for email', () => {
      const res = formatDateForEmail('2024-01-15')
      expect(res).toMatch(/15 January 2024/) // en-GB order
    })

    it('formats time for email', () => {
      expect(formatTimeForEmail('09:00')).toBe('9:00 AM')
    })
  })

  describe('slot helpers', () => {
    it('gets slot start time from variant keys', () => {
      expect(getSlotStartTime({ start_time: '10:00' })).toBe('10:00')
      expect(getSlotStartTime({ startTime: '11:30' })).toBe('11:30')
      expect(getSlotStartTime(undefined)).toBe('')
    })

    it('calculates end time correctly', () => {
      expect(calculateEndTime('09:15', 45)).toBe('10:00')
      expect(calculateEndTime('23:30', 60)).toBe('00:30')
    })
  })
})


