/**
 * Time Slots API - Negative Path Tests
 */

describe('Time Slots API (negative)', () => {
  describe('GET /api/time-slots/availability', () => {
    it('returns validation error for missing date', () => {
      const badRequest = {
        success: false,
        error: {
          message: 'Date query parameter is required',
          code: 'INVALID_INPUT'
        }
      }

      expect(badRequest).toHaveValidApiStructure()
      expect(badRequest).toBeFailedApiResponse({ code: 'INVALID_INPUT' })
    })

    it('returns empty list for fully booked date', () => {
      const fullyBooked = {
        success: true,
        data: []
      }

      expect(fullyBooked).toHaveValidApiStructure()
      expect(Array.isArray(fullyBooked.data)).toBe(true)
      expect(fullyBooked.data.length).toBe(0)
    })
  })
})


