import { isValidTransition, getValidNextStatuses, validateTransition, getStatusLabel, getStatusColor, requiresPayment, isActiveStatus, getRecommendedActions, type BookingStatus } from '@/lib/utils/status-transitions'

describe('status-transitions utils', () => {
  it('validates transitions', () => {
    expect(isValidTransition('pending', 'processing')).toBe(true)
    expect(isValidTransition('completed', 'pending')).toBe(false)
  })

  it('returns valid next statuses', () => {
    expect(getValidNextStatuses('pending')).toEqual(expect.arrayContaining(['processing', 'confirmed']))
  })

  it('validateTransition provides details', () => {
    const res1 = validateTransition('processing', 'confirmed', 'pending')
    expect(res1.valid).toBe(true)
    expect(res1.warning).toBeDefined()

    const res2 = validateTransition('completed', 'in_progress')
    expect(res2.valid).toBe(false)
    expect(res2.reason).toMatch(/Cannot start service/)
  })

  it('label and color mappings exist for all', () => {
    const statuses: BookingStatus[] = ['pending','processing','payment_failed','confirmed','rescheduled','in_progress','completed','declined','cancelled','no_show']
    for (const s of statuses) {
      expect(typeof getStatusLabel(s)).toBe('string')
      expect(typeof getStatusColor(s)).toBe('string')
      expect(Array.isArray(getRecommendedActions(s))).toBe(true)
    }
  })

  it('requiresPayment and isActiveStatus reflect categories', () => {
    expect(requiresPayment('processing')).toBe(true)
    expect(requiresPayment('confirmed')).toBe(false)
    expect(isActiveStatus('pending')).toBe(true)
    expect(isActiveStatus('cancelled')).toBe(false)
  })
})


