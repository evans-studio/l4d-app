import { BOOKING_BUFFER_MINUTES, formatTimeString, getMinimumBookableTime, isAfterMinimumBookableTime } from '@/lib/utils/time-validation'

describe('time-validation utils', () => {
  it('formats time safely', () => {
    expect(formatTimeString('9:5')).toBe('09:05')
    expect(formatTimeString('')).toBe('00:00')
  })

  it('getMinimumBookableTime respects buffer', () => {
    const min = getMinimumBookableTime()
    expect(min.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(min.time).toMatch(/^\d{2}:\d{2}$/)
    expect(BOOKING_BUFFER_MINUTES).toBeGreaterThanOrEqual(0)
  })

  it('isAfterMinimumBookableTime handles same-day time compare', () => {
    const min = getMinimumBookableTime()
    const earlier = '00:00'
    expect(isAfterMinimumBookableTime(min.date, earlier)).toBe(false)
    expect(isAfterMinimumBookableTime(min.date, min.time)).toBe(true)
  })
})


