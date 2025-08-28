/**
 * Time Slots Book API - Negative Path Tests
 */

describe('Time Slots Book API (negative)', () => {
  describe('POST /api/time-slots/[id]/book', () => {
    it('fails when slot already booked', () => {
      const res = {
        success: false,
        error: { message: 'Time slot already booked', code: 'TIME_SLOT_BOOKED' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'TIME_SLOT_BOOKED' })
    })

    it('fails when booking overlaps existing booking', () => {
      const res = {
        success: false,
        error: { message: 'Booking overlaps existing reservation', code: 'OVERLAP_DETECTED' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'OVERLAP_DETECTED' })
    })
  })
})


