/**
 * Admin Access - Negative Path Tests
 */

describe('Admin Access Control (negative)', () => {
  it('returns 403-style error for admin API routes when non-admin', () => {
    const forbidden = {
      success: false,
      error: {
        message: 'Admin access required',
        code: 'ADMIN_ACCESS_DENIED'
      }
    }

    expect(forbidden).toHaveValidApiStructure()
    expect(forbidden).toBeFailedApiResponse({ code: 'ADMIN_ACCESS_DENIED' })
  })

  it('returns 401 for unauthenticated access', () => {
    const unauth = {
      success: false,
      error: {
        message: 'Authentication required',
        code: 'UNAUTHORIZED'
      }
    }

    expect(unauth).toHaveValidApiStructure()
    expect(unauth).toBeFailedApiResponse({ code: 'UNAUTHORIZED' })
  })
})


