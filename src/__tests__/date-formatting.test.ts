import { formatDate, formatTime, calculateEndTime } from '@/lib/utils/date-formatting'

describe('date-formatting utilities', () => {
  test('formatDate handles ISO dates', () => {
    expect(formatDate('2025-08-19')).toContain('2025')
  })

  test('formatTime formats HH:mm', () => {
    expect(formatTime('13:05')).toBe('1:05 PM')
  })

  test('calculateEndTime adds minutes correctly', () => {
    expect(calculateEndTime('09:30', 90)).toBe('11:00')
  })
})


