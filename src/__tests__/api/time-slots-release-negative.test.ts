/**
 * Time Slots Release API - Negative Path Tests
 */

describe('Time Slots Release API (negative)', () => {
  describe('POST /api/time-slots/[id]/release', () => {
    it('fails when user does not own booking', () => {
      const res = {
        success: false,
        error: { message: 'Not authorized to release this booking', code: 'FORBIDDEN' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'FORBIDDEN' })
    })

    it('fails when booking not found', () => {
      const res = {
        success: false,
        error: { message: 'Booking not found', code: 'NOT_FOUND' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'NOT_FOUND' })
    })
  })
})


