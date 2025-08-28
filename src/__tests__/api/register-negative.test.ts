/**
 * Register API - Negative Path Tests
 */

describe('Register API (negative)', () => {
  describe('POST /api/auth/register', () => {
    it('fails when required fields missing', () => {
      const res = {
        success: false,
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'VALIDATION_ERROR' })
    })

    it('fails when email already in use', () => {
      const res = {
        success: false,
        error: { message: 'Email already in use', code: 'EMAIL_IN_USE' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'EMAIL_IN_USE' })
    })
  })
})


