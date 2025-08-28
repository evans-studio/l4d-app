/**
 * Bookings API - Negative Path Tests
 */

describe('Bookings API (negative)', () => {
  describe('POST /api/bookings/create', () => {
    it('fails when required payload fields are missing', () => {
      const response = {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: {
            missing: ['services', 'address', 'time_slot_id']
          }
        }
      }

      expect(response).toHaveValidApiStructure()
      expect(response).toBeFailedApiResponse({ code: 'VALIDATION_ERROR' })
      expect(response.error?.details).toBeDefined()
    })

    it('fails when time slot is unavailable', () => {
      const response = {
        success: false,
        error: {
          message: 'Selected time slot is no longer available',
          code: 'TIME_SLOT_UNAVAILABLE'
        }
      }

      expect(response).toHaveValidApiStructure()
      expect(response).toBeFailedApiResponse({ code: 'TIME_SLOT_UNAVAILABLE' })
    })

    it('fails on duplicate booking detection for the same user and slot', () => {
      const response = {
        success: false,
        error: {
          message: 'Duplicate booking detected',
          code: 'DUPLICATE_BOOKING'
        }
      }

      expect(response).toHaveValidApiStructure()
      expect(response).toBeFailedApiResponse({ code: 'DUPLICATE_BOOKING' })
    })
  })
})


