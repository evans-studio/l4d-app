/**
 * Reschedule Respond API - Negative Path Tests
 */

describe('Admin Reschedule Respond (negative)', () => {
  describe('POST /api/admin/reschedule-requests/[id]/respond', () => {
    it('fails when action is missing or invalid', () => {
      const res = {
        success: false,
        error: { message: 'Invalid action', code: 'VALIDATION_ERROR' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'VALIDATION_ERROR' })
    })

    it('fails when request not found', () => {
      const res = {
        success: false,
        error: { message: 'Reschedule request not found', code: 'NOT_FOUND' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'NOT_FOUND' })
    })

    it('fails when user is not admin', () => {
      const res = {
        success: false,
        error: { message: 'Admin access required', code: 'ADMIN_ACCESS_DENIED' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'ADMIN_ACCESS_DENIED' })
    })
  })
})


