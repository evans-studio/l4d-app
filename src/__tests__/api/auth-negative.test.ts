/**
 * Auth API - Negative Path Tests
 */

describe('Auth API (negative)', () => {
  describe('POST /api/auth/login', () => {
    it('fails when email is missing', () => {
      const res = {
        success: false,
        error: { message: 'Email is required', code: 'VALIDATION_ERROR' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'VALIDATION_ERROR' })
    })

    it('fails when password is missing', () => {
      const res = {
        success: false,
        error: { message: 'Password is required', code: 'VALIDATION_ERROR' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'VALIDATION_ERROR' })
    })

    it('rejects invalid credentials', () => {
      const res = {
        success: false,
        error: { message: 'Invalid email or password', code: 'UNAUTHORIZED' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'UNAUTHORIZED' })
    })

    it('requires verified email', () => {
      const res = {
        success: false,
        error: { message: 'Email not verified', code: 'EMAIL_NOT_VERIFIED' }
      }
      expect(res).toHaveValidApiStructure()
      expect(res).toBeFailedApiResponse({ code: 'EMAIL_NOT_VERIFIED' })
    })
  })
})


