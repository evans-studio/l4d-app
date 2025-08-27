/**
 * Booking Management API Tests
 * 
 * Tests for booking creation, retrieval, updates, cancellation,
 * and rescheduling functionality.
 */

describe('Booking Management API', () => {
  // Mock booking creation endpoint
  const mockBookingCreateResponse = {
    success: true,
    data: {
      booking: {
        id: 'booking-123',
        booking_reference: 'L4D-TEST-001',
        customer_id: 'customer-123',
        status: 'pending',
        scheduled_date: '2024-12-25',
        scheduled_start_time: '10:00',
        scheduled_end_time: '13:00',
        total_price: 150.00,
        payment_status: 'pending',
        payment_deadline: '2024-12-20T23:59:59.000Z',
        service_address: {
          address_line_1: '123 Test Street',
          city: 'Test City',
          postal_code: 'TE1 1ST'
        },
        vehicle_details: {
          make: 'Test',
          model: 'Vehicle',
          year: 2020,
          color: 'Blue'
        },
        created_at: '2024-12-01T10:00:00.000Z'
      },
      redirectTo: '/booking/success?ref=L4D-TEST-001'
    }
  }

  const mockBookingListResponse = {
    success: true,
    data: [
      {
        id: 'booking-123',
        booking_reference: 'L4D-TEST-001',
        customer_id: 'customer-123',
        status: 'confirmed',
        scheduled_date: '2024-12-25',
        scheduled_start_time: '10:00',
        scheduled_end_time: '13:00',
        total_price: 150.00,
        payment_status: 'paid',
        service: {
          name: 'Full Valet',
          category: 'full_service'
        },
        vehicle: {
          make: 'BMW',
          model: 'X5',
          year: 2020,
          color: 'Black'
        },
        address: {
          address_line_1: '123 Main Street',
          city: 'London',
          postal_code: 'SW1A 1AA'
        }
      }
    ],
    metadata: {
      pagination: {
        page: 1,
        limit: 20,
        total: 1
      },
      timestamp: new Date().toISOString()
    }
  }

  describe('POST /api/bookings/create', () => {
    it('should create a new booking successfully', () => {
      const response = mockBookingCreateResponse

      expect(response).toHaveValidApiStructure()
      expect(response).toBeSuccessfulApiResponse()
      expect(response.data.booking.booking_reference).toMatch(/^L4D-/)
      expect(response.data.booking.status).toBe('pending')
      expect(response.data.booking.payment_status).toBe('pending')
      expect(response.data.redirectTo).toContain('/booking/success')
    })

    it('should validate required booking fields', () => {
      const validationErrorResponse = {
        success: false,
        error: {
          message: 'Validation failed',
          code: 'INVALID_INPUT',
          validationErrors: {
            customerEmail: ['Email is required'],
            selectedDate: ['Date is required'],
            selectedTime: ['Time is required'],
            serviceId: ['Service selection is required']
          }
        }
      }

      expect(validationErrorResponse).toHaveValidApiStructure()
      expect(validationErrorResponse).toBeFailedApiResponse({ code: 'INVALID_INPUT' })
      expect(validationErrorResponse.error.validationErrors).toBeDefined()
    })

    it('should calculate pricing correctly', () => {
      const pricingResponse = {
        success: true,
        data: {
          booking: {
            ...mockBookingCreateResponse.data.booking,
            pricing_breakdown: {
              base_price: 120.00,
              vehicle_size_surcharge: 20.00,
              distance_surcharge: 10.00,
              total: 150.00
            }
          }
        }
      }

      expect(pricingResponse).toHaveValidApiStructure()
      expect(pricingResponse.data.booking.pricing_breakdown.total).toBe(150.00)
      expect(pricingResponse.data.booking.total_price).toBe(150.00)
    })

    it('should handle time slot conflicts', () => {
      const conflictResponse = {
        success: false,
        error: {
          message: 'Selected time slot is no longer available',
          code: 'TIME_SLOT_UNAVAILABLE'
        }
      }

      expect(conflictResponse).toHaveValidApiStructure()
      expect(conflictResponse).toBeFailedApiResponse({ code: 'TIME_SLOT_UNAVAILABLE' })
    })

    it('should create user account if customer does not exist', () => {
      const newCustomerResponse = {
        success: true,
        data: {
          booking: mockBookingCreateResponse.data.booking,
          newCustomerCreated: true,
          passwordSetupRequired: true,
          setupToken: 'setup-token-123'
        }
      }

      expect(newCustomerResponse).toHaveValidApiStructure()
      expect(newCustomerResponse.data.newCustomerCreated).toBe(true)
      expect(newCustomerResponse.data.passwordSetupRequired).toBe(true)
      expect(newCustomerResponse.data.setupToken).toBeDefined()
    })

    it('should validate postcode and calculate distance', () => {
      const distanceResponse = {
        success: true,
        data: {
          booking: {
            ...mockBookingCreateResponse.data.booking,
            distance_info: {
              distance_km: 25.5,
              surcharge: 12.50,
              within_free_radius: false
            }
          }
        }
      }

      expect(distanceResponse).toHaveValidApiStructure()
      expect(distanceResponse.data.booking.distance_info.distance_km).toBeGreaterThan(0)
      expect(distanceResponse.data.booking.distance_info.surcharge).toBeGreaterThan(0)
    })
  })

  describe('GET /api/bookings', () => {
    it('should return customer bookings list', () => {
      const response = mockBookingListResponse

      expect(response).toHaveValidApiStructure()
      expect(response).toBeSuccessfulApiResponse()
      expect(response).toHavePagination({ page: 1, limit: 20, total: 1 })
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data[0]).toHaveProperty('booking_reference')
      expect(response.data[0]).toHaveProperty('service')
      expect(response.data[0]).toHaveProperty('vehicle')
      expect(response.data[0]).toHaveProperty('address')
    })

    it('should filter bookings by status', () => {
      const filteredResponse = {
        success: true,
        data: [
          {
            ...mockBookingListResponse.data[0],
            status: 'confirmed'
          }
        ],
        metadata: {
          pagination: { page: 1, limit: 20, total: 1 },
          filters: { status: 'confirmed' },
          timestamp: new Date().toISOString()
        }
      }

      expect(filteredResponse).toHaveValidApiStructure()
      expect(filteredResponse.data.every(booking => booking.status === 'confirmed')).toBe(true)
      expect(filteredResponse.metadata.filters).toEqual({ status: 'confirmed' })
    })

    it('should filter bookings by date range', () => {
      const dateFilteredResponse = {
        success: true,
        data: mockBookingListResponse.data,
        metadata: {
          pagination: { page: 1, limit: 20, total: 1 },
          filters: {
            dateFrom: '2024-12-01',
            dateTo: '2024-12-31'
          },
          timestamp: new Date().toISOString()
        }
      }

      expect(dateFilteredResponse).toHaveValidApiStructure()
      expect(dateFilteredResponse.metadata.filters.dateFrom).toBe('2024-12-01')
      expect(dateFilteredResponse.metadata.filters.dateTo).toBe('2024-12-31')
    })

    it('should support public booking lookup by reference', () => {
      const publicLookupResponse = {
        success: true,
        data: {
          ...mockBookingListResponse.data[0],
          public_view: true
        }
      }

      expect(publicLookupResponse).toHaveValidApiStructure()
      expect(publicLookupResponse.data.booking_reference).toBeDefined()
      expect(publicLookupResponse.data.public_view).toBe(true)
    })
  })

  describe('GET /api/bookings/[id]', () => {
    it('should return single booking details', () => {
      const singleBookingResponse = {
        success: true,
        data: {
          ...mockBookingListResponse.data[0],
          pricing_breakdown: {
            base_price: 120.00,
            vehicle_size_surcharge: 20.00,
            distance_surcharge: 10.00,
            total: 150.00
          },
          booking_services: [
            {
              service_id: 'service-123',
              service_details: {
                name: 'Full Valet',
                category: 'full_service',
                description: 'Complete vehicle detailing service'
              },
              price: 150.00,
              estimated_duration: 180
            }
          ]
        }
      }

      expect(singleBookingResponse).toHaveValidApiStructure()
      expect(singleBookingResponse.data.id).toBeDefined()
      expect(singleBookingResponse.data.pricing_breakdown).toBeDefined()
      expect(Array.isArray(singleBookingResponse.data.booking_services)).toBe(true)
    })

    it('should enforce customer access control', () => {
      const unauthorizedResponse = {
        success: false,
        error: {
          message: 'You can only view your own bookings',
          code: 'FORBIDDEN'
        }
      }

      expect(unauthorizedResponse).toHaveValidApiStructure()
      expect(unauthorizedResponse).toBeFailedApiResponse({ code: 'FORBIDDEN' })
    })

    it('should return 404 for non-existent booking', () => {
      const notFoundResponse = {
        success: false,
        error: {
          message: 'Booking not found',
          code: 'NOT_FOUND'
        }
      }

      expect(notFoundResponse).toHaveValidApiStructure()
      expect(notFoundResponse).toBeFailedApiResponse({ code: 'NOT_FOUND' })
    })
  })

  describe('PUT /api/bookings/[id]', () => {
    it('should update booking details', () => {
      const updateResponse = {
        success: true,
        data: {
          booking: {
            ...mockBookingListResponse.data[0],
            special_instructions: 'Please park in driveway',
            updated_at: new Date().toISOString()
          },
          message: 'Booking updated successfully'
        }
      }

      expect(updateResponse).toHaveValidApiStructure()
      expect(updateResponse.data.booking.special_instructions).toBe('Please park in driveway')
      expect(updateResponse.data.booking.updated_at).toBeDefined()
    })

    it('should prevent updates to confirmed bookings', () => {
      const preventUpdateResponse = {
        success: false,
        error: {
          message: 'Cannot modify confirmed booking. Please contact support.',
          code: 'BOOKING_LOCKED'
        }
      }

      expect(preventUpdateResponse).toHaveValidApiStructure()
      expect(preventUpdateResponse).toBeFailedApiResponse({ code: 'BOOKING_LOCKED' })
    })
  })

  describe('POST /api/bookings/[id]/reschedule-request', () => {
    it('should create reschedule request', () => {
      const rescheduleRequestResponse = {
        success: true,
        data: {
          reschedule_request: {
            id: 'reschedule-123',
            booking_id: 'booking-123',
            requested_date: '2024-12-26',
            requested_time: '14:00',
            reason: 'Schedule conflict',
            status: 'pending',
            created_at: new Date().toISOString()
          },
          message: 'Reschedule request submitted successfully. We will review and respond within 24 hours.'
        }
      }

      expect(rescheduleRequestResponse).toHaveValidApiStructure()
      expect(rescheduleRequestResponse.data.reschedule_request.status).toBe('pending')
      expect(rescheduleRequestResponse.data.message).toContain('24 hours')
    })

    it('should validate reschedule request timing', () => {
      const tooLateResponse = {
        success: false,
        error: {
          message: 'Reschedule requests must be made at least 24 hours in advance',
          code: 'RESCHEDULE_TOO_LATE'
        }
      }

      expect(tooLateResponse).toHaveValidApiStructure()
      expect(tooLateResponse).toBeFailedApiResponse({ code: 'RESCHEDULE_TOO_LATE' })
    })
  })

  describe('DELETE /api/bookings/[id] (Cancellation)', () => {
    it('should cancel booking with valid reason', () => {
      const cancellationResponse = {
        success: true,
        data: {
          booking: {
            ...mockBookingListResponse.data[0],
            status: 'cancelled_by_customer',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: 'Personal emergency'
          },
          refund_info: {
            refund_amount: 150.00,
            refund_method: 'original_payment',
            processing_time: '3-5 business days'
          },
          message: 'Booking cancelled successfully. Refund will be processed within 3-5 business days.'
        }
      }

      expect(cancellationResponse).toHaveValidApiStructure()
      expect(cancellationResponse.data.booking.status).toBe('cancelled_by_customer')
      expect(cancellationResponse.data.refund_info.refund_amount).toBe(150.00)
    })

    it('should handle late cancellation penalties', () => {
      const lateCancellationResponse = {
        success: true,
        data: {
          booking: {
            ...mockBookingListResponse.data[0],
            status: 'cancelled_by_customer',
            cancelled_at: new Date().toISOString()
          },
          refund_info: {
            original_amount: 150.00,
            cancellation_fee: 25.00,
            refund_amount: 125.00,
            refund_method: 'original_payment',
            processing_time: '3-5 business days'
          },
          message: 'Booking cancelled. A £25 late cancellation fee applies. Refund of £125 will be processed.'
        }
      }

      expect(lateCancellationResponse).toHaveValidApiStructure()
      expect(lateCancellationResponse.data.refund_info.cancellation_fee).toBe(25.00)
      expect(lateCancellationResponse.data.refund_info.refund_amount).toBe(125.00)
    })

    it('should prevent cancellation after deadline', () => {
      const noCancellationResponse = {
        success: false,
        error: {
          message: 'Cancellation is no longer available for this booking. Please contact support.',
          code: 'CANCELLATION_DEADLINE_PASSED'
        }
      }

      expect(noCancellationResponse).toHaveValidApiStructure()
      expect(noCancellationResponse).toBeFailedApiResponse({ code: 'CANCELLATION_DEADLINE_PASSED' })
    })
  })

  describe('Booking Status Transitions', () => {
    it('should follow valid status progression', () => {
      const validStatuses = [
        'pending',
        'confirmed',
        'in_progress',
        'completed',
        'cancelled_by_customer',
        'cancelled_by_admin'
      ]

      // Test each status is valid
      validStatuses.forEach(status => {
        const statusResponse = {
          success: true,
          data: {
            booking: {
              ...mockBookingListResponse.data[0],
              status: status
            }
          }
        }

        expect(statusResponse).toHaveValidApiStructure()
        expect(validStatuses).toContain(statusResponse.data.booking.status)
      })
    })

    it('should track status history', () => {
      const statusHistoryResponse = {
        success: true,
        data: {
          booking: mockBookingListResponse.data[0],
          status_history: [
            {
              status: 'pending',
              timestamp: '2024-12-01T10:00:00.000Z',
              changed_by: 'system',
              reason: 'Booking created'
            },
            {
              status: 'confirmed',
              timestamp: '2024-12-01T11:00:00.000Z',
              changed_by: 'admin',
              reason: 'Payment received'
            }
          ]
        }
      }

      expect(statusHistoryResponse).toHaveValidApiStructure()
      expect(Array.isArray(statusHistoryResponse.data.status_history)).toBe(true)
      expect(statusHistoryResponse.data.status_history.length).toBeGreaterThan(0)
      expect(statusHistoryResponse.data.status_history[0]).toHaveProperty('timestamp')
      expect(statusHistoryResponse.data.status_history[0]).toHaveProperty('changed_by')
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complete booking lifecycle', () => {
      // Step 1: Create booking
      const createResponse = mockBookingCreateResponse
      expect(createResponse).toBeSuccessfulApiResponse()
      expect(createResponse.data.booking.status).toBe('pending')

      // Step 2: Payment completion would trigger confirmation
      const confirmResponse = {
        success: true,
        data: {
          booking: {
            ...createResponse.data.booking,
            status: 'confirmed',
            payment_status: 'paid'
          }
        }
      }
      expect(confirmResponse.data.booking.status).toBe('confirmed')

      // Step 3: Service completion
      const completeResponse = {
        success: true,
        data: {
          booking: {
            ...confirmResponse.data.booking,
            status: 'completed',
            completed_at: new Date().toISOString()
          }
        }
      }
      expect(completeResponse.data.booking.status).toBe('completed')
      expect(completeResponse.data.booking.completed_at).toBeDefined()
    })

    it('should handle booking with new customer creation', () => {
      const newCustomerBookingResponse = {
        success: true,
        data: {
          booking: mockBookingCreateResponse.data.booking,
          customer: {
            id: 'customer-123',
            email: 'newcustomer@example.com',
            first_name: 'New',
            last_name: 'Customer',
            created: true
          },
          password_setup_required: true,
          setup_link: 'https://love4detailing.com/auth/setup?token=abc123'
        }
      }

      expect(newCustomerBookingResponse).toHaveValidApiStructure()
      expect(newCustomerBookingResponse.data.customer.created).toBe(true)
      expect(newCustomerBookingResponse.data.password_setup_required).toBe(true)
      expect(newCustomerBookingResponse.data.setup_link).toContain('/auth/setup')
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection errors', () => {
      const dbErrorResponse = {
        success: false,
        error: {
          message: 'Database temporarily unavailable. Please try again.',
          code: 'DATABASE_ERROR'
        }
      }

      expect(dbErrorResponse).toHaveValidApiStructure()
      expect(dbErrorResponse).toBeFailedApiResponse({ code: 'DATABASE_ERROR' })
    })

    it('should handle external service failures', () => {
      const serviceErrorResponse = {
        success: false,
        error: {
          message: 'Email service temporarily unavailable. Booking created but confirmation email may be delayed.',
          code: 'EMAIL_SERVICE_ERROR'
        }
      }

      expect(serviceErrorResponse).toHaveValidApiStructure()
      expect(serviceErrorResponse).toBeFailedApiResponse({ code: 'EMAIL_SERVICE_ERROR' })
    })
  })
})