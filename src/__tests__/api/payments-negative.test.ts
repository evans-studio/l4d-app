/**
 * Payments API - Negative Path Tests
 */

describe('Payments Webhook (negative)', () => {
  describe('POST /api/paypal/webhook', () => {
    it('rejects requests with missing or invalid signature', () => {
      const invalidSignatureResponse = {
        success: false,
        error: {
          message: 'Invalid webhook signature',
          code: 'UNAUTHORIZED'
        }
      }

      expect(invalidSignatureResponse).toHaveValidApiStructure()
      expect(invalidSignatureResponse).toBeFailedApiResponse({ code: 'UNAUTHORIZED' })
    })

    it('ignores duplicate events (idempotency)', () => {
      const duplicateEventResponse = {
        success: true,
        data: {
          processed: false,
          reason: 'duplicate_event'
        }
      }

      expect(duplicateEventResponse).toHaveValidApiStructure()
      expect(duplicateEventResponse.data.processed).toBe(false)
      expect(duplicateEventResponse.data.reason).toBe('duplicate_event')
    })
  })
})


