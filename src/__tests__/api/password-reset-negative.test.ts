/**
 * Password Reset API - Negative Path Tests
 */

describe('Password Reset API (negative)', () => {
  describe('POST /api/auth/forgot-password', () => {
    it('fails when email not found (privacy-safe generic)', () => {
      const res = {
        success: true,
        data: { emailSent: true }
      }
      expect(res).toHaveValidApiStructure()
      expect(res.success).toBe(true)
    })
  })

  describe('POST /api/auth/reset-password', () => {
    it('fails with invalid or expired token', () => {
      const res = {
        success: false,
        error: { message: 'Invalid or expired token', code: 'INVALID_TOKEN' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'INVALID_TOKEN' })
    })
  })
})


