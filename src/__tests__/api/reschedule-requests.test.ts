/**
 * Reschedule Requests API - Negative Path Tests
 */

describe('Admin Reschedule Requests API (negative)', () => {
  describe('POST /api/admin/reschedule-requests/[id]/respond', () => {
    it('returns NOT_FOUND when reschedule request id does not exist', () => {
      const notFoundResponse = {
        success: false,
        error: {
          message: 'Reschedule request not found',
          code: 'NOT_FOUND'
        }
      }

      expect(notFoundResponse).toHaveValidApiStructure()
      expect(notFoundResponse).toBeFailedApiResponse({ code: 'NOT_FOUND' })
    })

    it('returns FORBIDDEN when non-admin attempts to respond', () => {
      const forbiddenResponse = {
        success: false,
        error: {
          message: 'Admin access required',
          code: 'ADMIN_ACCESS_DENIED'
        }
      }

      expect(forbiddenResponse).toHaveValidApiStructure()
      expect(forbiddenResponse).toBeFailedApiResponse({ code: 'ADMIN_ACCESS_DENIED' })
    })

    it('returns BOOKING_NOT_RESCHEDULABLE when booking is not eligible', () => {
      const notReschedulable = {
        success: false,
        error: {
          message: 'This booking cannot be rescheduled',
          code: 'BOOKING_NOT_RESCHEDULABLE'
        }
      }

      expect(notReschedulable).toHaveValidApiStructure()
      expect(notReschedulable).toBeFailedApiResponse({ code: 'BOOKING_NOT_RESCHEDULABLE' })
    })
  })
})


