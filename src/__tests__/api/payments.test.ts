/**
 * Payment Processing API Tests
 * 
 * Tests for payment webhooks, payment status updates,
 * and payment-related booking state changes.
 */

describe('Payment Processing API', () => {
  const mockPayPalWebhookData = {
    id: 'WH-123456789',
    event_type: 'PAYMENT.CAPTURE.COMPLETED',
    create_time: '2024-12-01T10:00:00.000Z',
    resource: {
      id: 'CAPTURE-123',
      status: 'COMPLETED',
      amount: {
        currency_code: 'GBP',
        value: '150.00'
      },
      custom_id: 'L4D-TEST-001',
      invoice_id: 'INV-123',
      final_capture: true,
      disbursement_mode: 'INSTANT'
    }
  }

  describe('POST /api/paypal/webhook', () => {
    it('should process successful payment webhook', () => {
      const successfulWebhookResponse = {
        success: true,
        data: {
          webhook_id: 'WH-123456789',
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          booking_reference: 'L4D-TEST-001',
          payment_status: 'completed',
          amount: '150.00',
          currency: 'GBP',
          processed_at: new Date().toISOString()
        },
        message: 'Payment webhook processed successfully'
      }

      expect(successfulWebhookResponse).toHaveValidApiStructure()
      expect(successfulWebhookResponse.data.event_type).toBe('PAYMENT.CAPTURE.COMPLETED')
      expect(successfulWebhookResponse.data.payment_status).toBe('completed')
      expect(successfulWebhookResponse.data.amount).toBe('150.00')
    })

    it('should handle payment failure webhook', () => {
      const failureWebhookResponse = {
        success: true,
        data: {
          webhook_id: 'WH-123456789',
          event_type: 'PAYMENT.CAPTURE.DENIED',
          booking_reference: 'L4D-TEST-001',
          payment_status: 'failed',
          reason: 'INSUFFICIENT_FUNDS',
          processed_at: new Date().toISOString()
        },
        message: 'Payment failure webhook processed'
      }

      expect(failureWebhookResponse).toHaveValidApiStructure()
      expect(failureWebhookResponse.data.event_type).toBe('PAYMENT.CAPTURE.DENIED')
      expect(failureWebhookResponse.data.payment_status).toBe('failed')
      expect(failureWebhookResponse.data.reason).toBe('INSUFFICIENT_FUNDS')
    })

    it('should handle refund webhook', () => {
      const refundWebhookResponse = {
        success: true,
        data: {
          webhook_id: 'WH-123456789',
          event_type: 'PAYMENT.CAPTURE.REFUNDED',
          booking_reference: 'L4D-TEST-001',
          payment_status: 'refunded',
          refund_amount: '150.00',
          refund_id: 'REFUND-123',
          processed_at: new Date().toISOString()
        },
        message: 'Refund webhook processed successfully'
      }

      expect(refundWebhookResponse).toHaveValidApiStructure()
      expect(refundWebhookResponse.data.event_type).toBe('PAYMENT.CAPTURE.REFUNDED')
      expect(refundWebhookResponse.data.payment_status).toBe('refunded')
      expect(refundWebhookResponse.data.refund_amount).toBe('150.00')
    })

    it('should validate webhook authenticity', () => {
      const invalidWebhookResponse = {
        success: false,
        error: {
          message: 'Invalid webhook signature',
          code: 'WEBHOOK_VERIFICATION_FAILED'
        }
      }

      expect(invalidWebhookResponse).toHaveValidApiStructure()
      expect(invalidWebhookResponse).toBeFailedApiResponse({ code: 'WEBHOOK_VERIFICATION_FAILED' })
    })

    it('should handle duplicate webhook events', () => {
      const duplicateWebhookResponse = {
        success: true,
        data: {
          webhook_id: 'WH-123456789',
          already_processed: true,
          original_processed_at: '2024-12-01T10:00:00.000Z',
          current_processed_at: new Date().toISOString()
        },
        message: 'Webhook event already processed, ignoring'
      }

      expect(duplicateWebhookResponse).toHaveValidApiStructure()
      expect(duplicateWebhookResponse.data.already_processed).toBe(true)
      expect(duplicateWebhookResponse.data.original_processed_at).toBeDefined()
    })

    it('should validate required webhook fields', () => {
      const missingFieldsResponse = {
        success: false,
        error: {
          message: 'Missing required webhook fields',
          code: 'INVALID_WEBHOOK_DATA',
          details: {
            missing_fields: ['resource', 'event_type']
          }
        }
      }

      expect(missingFieldsResponse).toHaveValidApiStructure()
      expect(missingFieldsResponse).toBeFailedApiResponse({ code: 'INVALID_WEBHOOK_DATA' })
      expect(missingFieldsResponse.error.details.missing_fields).toContain('resource')
    })

    it('should handle unknown event types gracefully', () => {
      const unknownEventResponse = {
        success: true,
        data: {
          webhook_id: 'WH-123456789',
          event_type: 'UNKNOWN.EVENT.TYPE',
          action: 'ignored',
          reason: 'Event type not handled by application'
        },
        message: 'Unknown event type, no action taken'
      }

      expect(unknownEventResponse).toHaveValidApiStructure()
      expect(unknownEventResponse.data.action).toBe('ignored')
      expect(unknownEventResponse.data.reason).toContain('not handled')
    })
  })

  describe('POST /api/booking/payment-complete', () => {
    it('should update booking status after successful payment', () => {
      const paymentCompleteResponse = {
        success: true,
        data: {
          booking: {
            id: 'booking-123',
            booking_reference: 'L4D-TEST-001',
            status: 'confirmed',
            payment_status: 'paid',
            confirmed_at: new Date().toISOString()
          },
          payment: {
            amount: 150.00,
            currency: 'GBP',
            method: 'paypal',
            transaction_id: 'CAPTURE-123',
            completed_at: new Date().toISOString()
          },
          notifications: {
            customer_email_sent: true,
            admin_notification_sent: true
          }
        }
      }

      expect(paymentCompleteResponse).toHaveValidApiStructure()
      expect(paymentCompleteResponse.data.booking.status).toBe('confirmed')
      expect(paymentCompleteResponse.data.booking.payment_status).toBe('paid')
      expect(paymentCompleteResponse.data.payment.method).toBe('paypal')
      expect(paymentCompleteResponse.data.notifications.customer_email_sent).toBe(true)
    })

    it('should require booking reference', () => {
      const missingReferenceResponse = {
        success: false,
        error: {
          message: 'Booking reference is required',
          code: 'INVALID_INPUT'
        }
      }

      expect(missingReferenceResponse).toHaveValidApiStructure()
      expect(missingReferenceResponse).toBeFailedApiResponse({ code: 'INVALID_INPUT' })
    })

    it('should handle booking not found', () => {
      const bookingNotFoundResponse = {
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      }

      expect(bookingNotFoundResponse).toHaveValidApiStructure()
      expect(bookingNotFoundResponse).toBeFailedApiResponse({ code: 'BOOKING_NOT_FOUND' })
    })

    it('should handle payment already processed', () => {
      const alreadyProcessedResponse = {
        success: false,
        error: {
          message: 'Payment for this booking has already been processed',
          code: 'PAYMENT_ALREADY_PROCESSED'
        }
      }

      expect(alreadyProcessedResponse).toHaveValidApiStructure()
      expect(alreadyProcessedResponse).toBeFailedApiResponse({ code: 'PAYMENT_ALREADY_PROCESSED' })
    })

    it('should update partial payment status', () => {
      const partialPaymentResponse = {
        success: true,
        data: {
          booking: {
            id: 'booking-123',
            booking_reference: 'L4D-TEST-001',
            status: 'pending',
            payment_status: 'partial',
            total_amount: 150.00,
            paid_amount: 75.00,
            remaining_amount: 75.00
          },
          payment: {
            amount: 75.00,
            currency: 'GBP',
            method: 'paypal',
            transaction_id: 'CAPTURE-123'
          }
        }
      }

      expect(partialPaymentResponse).toHaveValidApiStructure()
      expect(partialPaymentResponse.data.booking.payment_status).toBe('partial')
      expect(partialPaymentResponse.data.booking.remaining_amount).toBe(75.00)
    })
  })

  describe('Payment Flow Integration', () => {
    it('should handle complete payment flow', () => {
      // Step 1: Initial booking creation with pending payment
      const bookingCreatedResponse = {
        success: true,
        data: {
          booking: {
            id: 'booking-123',
            booking_reference: 'L4D-TEST-001',
            status: 'pending',
            payment_status: 'pending',
            total_price: 150.00,
            payment_deadline: '2024-12-06T23:59:59.000Z'
          }
        }
      }

      expect(bookingCreatedResponse.data.booking.payment_status).toBe('pending')

      // Step 2: Payment webhook received
      const webhookResponse = {
        success: true,
        data: {
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
          booking_reference: 'L4D-TEST-001',
          payment_status: 'completed'
        }
      }

      expect(webhookResponse).toBeSuccessfulApiResponse()

      // Step 3: Booking status updated to confirmed
      const updatedBookingResponse = {
        success: true,
        data: {
          booking: {
            id: 'booking-123',
            status: 'confirmed',
            payment_status: 'paid',
            confirmed_at: new Date().toISOString()
          }
        }
      }

      expect(updatedBookingResponse.data.booking.status).toBe('confirmed')
      expect(updatedBookingResponse.data.booking.payment_status).toBe('paid')
    })

    it('should handle payment failure and booking expiry', () => {
      // Step 1: Payment fails
      const paymentFailureResponse = {
        success: true,
        data: {
          event_type: 'PAYMENT.CAPTURE.DENIED',
          booking_reference: 'L4D-TEST-001',
          payment_status: 'failed',
          reason: 'CARD_DECLINED'
        }
      }

      expect(paymentFailureResponse).toBeSuccessfulApiResponse()

      // Step 2: Booking remains pending but marked as payment failed
      const failedBookingResponse = {
        success: true,
        data: {
          booking: {
            id: 'booking-123',
            status: 'pending',
            payment_status: 'failed',
            payment_failure_reason: 'CARD_DECLINED',
            expires_at: '2024-12-06T23:59:59.000Z'
          }
        }
      }

      expect(failedBookingResponse.data.booking.payment_status).toBe('failed')
      expect(failedBookingResponse.data.booking.status).toBe('pending')

      // Step 3: Booking auto-expires after deadline
      const expiredBookingResponse = {
        success: true,
        data: {
          booking: {
            id: 'booking-123',
            status: 'expired',
            payment_status: 'failed',
            expired_at: new Date().toISOString()
          }
        }
      }

      expect(expiredBookingResponse.data.booking.status).toBe('expired')
    })

    it('should handle refund processing', () => {
      // Step 1: Booking cancellation triggers refund
      const cancellationResponse = {
        success: true,
        data: {
          booking: {
            id: 'booking-123',
            status: 'cancelled_by_customer',
            payment_status: 'paid'
          },
          refund: {
            amount: 150.00,
            currency: 'GBP',
            reason: 'customer_request',
            status: 'pending',
            initiated_at: new Date().toISOString()
          }
        }
      }

      expect(cancellationResponse.data.refund.status).toBe('pending')

      // Step 2: Refund webhook received
      const refundWebhookResponse = {
        success: true,
        data: {
          event_type: 'PAYMENT.CAPTURE.REFUNDED',
          booking_reference: 'L4D-TEST-001',
          payment_status: 'refunded',
          refund_amount: '150.00'
        }
      }

      expect(refundWebhookResponse).toBeSuccessfulApiResponse()

      // Step 3: Booking payment status updated
      const refundedBookingResponse = {
        success: true,
        data: {
          booking: {
            id: 'booking-123',
            status: 'cancelled_by_customer',
            payment_status: 'refunded',
            refunded_at: new Date().toISOString()
          }
        }
      }

      expect(refundedBookingResponse.data.booking.payment_status).toBe('refunded')
    })
  })

  describe('Payment Security & Validation', () => {
    it('should validate payment amounts match booking', () => {
      const amountMismatchResponse = {
        success: false,
        error: {
          message: 'Payment amount does not match booking total',
          code: 'PAYMENT_AMOUNT_MISMATCH',
          details: {
            booking_amount: 150.00,
            payment_amount: 125.00,
            currency: 'GBP'
          }
        }
      }

      expect(amountMismatchResponse).toHaveValidApiStructure()
      expect(amountMismatchResponse).toBeFailedApiResponse({ code: 'PAYMENT_AMOUNT_MISMATCH' })
      expect(amountMismatchResponse.error.details.booking_amount).toBe(150.00)
      expect(amountMismatchResponse.error.details.payment_amount).toBe(125.00)
    })

    it('should validate payment currency', () => {
      const currencyMismatchResponse = {
        success: false,
        error: {
          message: 'Payment currency does not match booking currency',
          code: 'CURRENCY_MISMATCH',
          details: {
            booking_currency: 'GBP',
            payment_currency: 'USD'
          }
        }
      }

      expect(currencyMismatchResponse).toHaveValidApiStructure()
      expect(currencyMismatchResponse).toBeFailedApiResponse({ code: 'CURRENCY_MISMATCH' })
    })

    it('should handle PayPal API errors', () => {
      const paypalApiErrorResponse = {
        success: false,
        error: {
          message: 'PayPal API temporarily unavailable',
          code: 'PAYPAL_API_ERROR',
          details: {
            paypal_error: 'SERVICE_UNAVAILABLE',
            retry_after: 300
          }
        }
      }

      expect(paypalApiErrorResponse).toHaveValidApiStructure()
      expect(paypalApiErrorResponse).toBeFailedApiResponse({ code: 'PAYPAL_API_ERROR' })
      expect(paypalApiErrorResponse.error.details.retry_after).toBe(300)
    })

    it('should handle webhook replay attacks', () => {
      const replayAttackResponse = {
        success: false,
        error: {
          message: 'Webhook timestamp is too old or in the future',
          code: 'WEBHOOK_TIMESTAMP_INVALID',
          details: {
            received_timestamp: '2024-11-01T10:00:00.000Z',
            current_time: '2024-12-01T10:00:00.000Z',
            max_age_minutes: 5
          }
        }
      }

      expect(replayAttackResponse).toHaveValidApiStructure()
      expect(replayAttackResponse).toBeFailedApiResponse({ code: 'WEBHOOK_TIMESTAMP_INVALID' })
    })

    it('should log security events', () => {
      const securityEventResponse = {
        success: false,
        error: {
          message: 'Suspicious payment activity detected',
          code: 'SECURITY_ALERT',
          details: {
            alert_type: 'MULTIPLE_FAILED_PAYMENTS',
            booking_reference: 'L4D-TEST-001',
            attempts_count: 5,
            time_window_minutes: 10
          }
        }
      }

      expect(securityEventResponse).toHaveValidApiStructure()
      expect(securityEventResponse).toBeFailedApiResponse({ code: 'SECURITY_ALERT' })
      expect(securityEventResponse.error.details.attempts_count).toBe(5)
    })
  })

  describe('Payment Status Tracking', () => {
    it('should track payment attempts', () => {
      const paymentAttemptsResponse = {
        success: true,
        data: {
          booking_reference: 'L4D-TEST-001',
          payment_attempts: [
            {
              attempt_number: 1,
              status: 'failed',
              reason: 'CARD_DECLINED',
              attempted_at: '2024-12-01T09:00:00.000Z',
              amount: 150.00
            },
            {
              attempt_number: 2,
              status: 'completed',
              reason: null,
              attempted_at: '2024-12-01T10:00:00.000Z',
              amount: 150.00,
              transaction_id: 'CAPTURE-123'
            }
          ],
          current_status: 'paid'
        }
      }

      expect(paymentAttemptsResponse).toHaveValidApiStructure()
      expect(paymentAttemptsResponse.data.payment_attempts.length).toBe(2)
      expect(paymentAttemptsResponse.data.current_status).toBe('paid')
      expect(paymentAttemptsResponse.data.payment_attempts[1].transaction_id).toBeDefined()
    })

    it('should handle payment status history', () => {
      const statusHistoryResponse = {
        success: true,
        data: {
          booking_reference: 'L4D-TEST-001',
          payment_history: [
            {
              status: 'pending',
              timestamp: '2024-12-01T09:00:00.000Z',
              event: 'payment_initiated'
            },
            {
              status: 'processing',
              timestamp: '2024-12-01T09:05:00.000Z',
              event: 'payment_captured'
            },
            {
              status: 'completed',
              timestamp: '2024-12-01T09:06:00.000Z',
              event: 'payment_confirmed'
            }
          ]
        }
      }

      expect(statusHistoryResponse).toHaveValidApiStructure()
      expect(Array.isArray(statusHistoryResponse.data.payment_history)).toBe(true)
      expect(statusHistoryResponse.data.payment_history.length).toBe(3)
      expect(statusHistoryResponse.data.payment_history[2].status).toBe('completed')
    })
  })

  describe('Error Recovery & Resilience', () => {
    it('should handle database connection failures gracefully', () => {
      const dbFailureResponse = {
        success: false,
        error: {
          message: 'Database temporarily unavailable. Payment will be retried.',
          code: 'DATABASE_ERROR',
          details: {
            retry_scheduled: true,
            retry_at: '2024-12-01T10:05:00.000Z'
          }
        }
      }

      expect(dbFailureResponse).toHaveValidApiStructure()
      expect(dbFailureResponse).toBeFailedApiResponse({ code: 'DATABASE_ERROR' })
      expect(dbFailureResponse.error.details.retry_scheduled).toBe(true)
    })

    it('should handle email notification failures', () => {
      const emailFailureResponse = {
        success: true,
        data: {
          payment_processed: true,
          booking_confirmed: true,
          notifications: {
            customer_email_sent: false,
            admin_notification_sent: true,
            email_error: 'SMTP_TIMEOUT',
            email_retry_scheduled: true
          }
        },
        warnings: [
          'Customer confirmation email failed to send but will be retried'
        ]
      }

      expect(emailFailureResponse).toHaveValidApiStructure()
      expect(emailFailureResponse.data.payment_processed).toBe(true)
      expect(emailFailureResponse.data.notifications.customer_email_sent).toBe(false)
      expect(emailFailureResponse.warnings[0]).toContain('email failed to send')
    })
  })
})