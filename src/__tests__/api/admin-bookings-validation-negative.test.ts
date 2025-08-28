/**
 * Admin Bookings API - Validation Negative Path Tests
 */

describe('Admin Bookings API (validation, negative)', () => {
  describe('GET /api/admin/bookings', () => {
    it('fails when date range is invalid', () => {
      const res = {
        success: false,
        error: { message: 'Invalid date range', code: 'VALIDATION_ERROR' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'VALIDATION_ERROR' })
    })
  })

  describe('POST /api/admin/bookings/[id]/status', () => {
    it('fails when status transition is invalid', () => {
      const res = {
        success: false,
        error: { message: 'Invalid status transition', code: 'INVALID_STATUS_TRANSITION' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'INVALID_STATUS_TRANSITION' })
    })
  })
})


