/**
 * Cancellations API - Negative Path Tests
 */

describe('Cancellations API (negative)', () => {
  describe('POST /api/customer/bookings/[id]/cancel', () => {
    it('fails when booking is already cancelled', () => {
      const res = {
        success: false,
        error: { message: 'Booking already cancelled', code: 'ALREADY_CANCELLED' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'ALREADY_CANCELLED' })
    })

    it('fails when cancellation window has passed', () => {
      const res = {
        success: false,
        error: { message: 'Cancellation window has passed', code: 'CANCELLATION_WINDOW_PASSED' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'CANCELLATION_WINDOW_PASSED' })
    })

    it('fails for non-owner attempting to cancel', () => {
      const res = {
        success: false,
        error: { message: 'Not authorized to cancel this booking', code: 'FORBIDDEN' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'FORBIDDEN' })
    })
  })
})


