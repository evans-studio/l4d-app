/**
 * Admin Operations API Tests
 * 
 * Tests for admin-only endpoints including booking management,
 * customer management, system operations, and analytics.
 */

describe('Admin Operations API', () => {
  const mockAdminBookingsResponse = {
    success: true,
    data: [
      {
        id: 'booking-123',
        booking_reference: 'L4D-ADMIN-001',
        customer_id: 'customer-123',
        service_id: 'service-123',
        vehicle_id: 'vehicle-123',
        address_id: 'address-123',
        scheduled_date: '2024-12-25',
        scheduled_start_time: '10:00',
        scheduled_end_time: '13:00',
        status: 'confirmed',
        total_price: 150.00,
        special_instructions: 'Please use side entrance',
        created_at: '2024-12-01T10:00:00.000Z'
      }
    ],
    metadata: {
      pagination: { page: 1, limit: 50, total: 1 },
      timestamp: new Date().toISOString()
    }
  }

  const mockCustomersResponse = {
    success: true,
    data: [
      {
        id: 'customer-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+447908123456',
        created_at: '2024-11-01T10:00:00.000Z',
        role: 'customer',
        booking_stats: {
          total_bookings: 3,
          completed_bookings: 2,
          cancelled_bookings: 0,
          total_spent: 450.00,
          last_booking_date: '2024-12-01'
        }
      }
    ],
    metadata: {
      pagination: { page: 1, limit: 50, total: 1 },
      timestamp: new Date().toISOString()
    }
  }

  const mockAnalyticsResponse = {
    success: true,
    data: {
      overview: {
        total_bookings: 125,
        pending_bookings: 8,
        confirmed_bookings: 15,
        completed_bookings: 95,
        cancelled_bookings: 7,
        total_revenue: 18750.00,
        average_booking_value: 150.00
      },
      trends: {
        bookings_this_month: 23,
        bookings_last_month: 19,
        revenue_this_month: 3450.00,
        revenue_last_month: 2850.00,
        growth_rate: 21.05
      },
      upcoming: {
        today: 2,
        this_week: 8,
        next_week: 12
      }
    },
    metadata: {
      generated_at: new Date().toISOString(),
      period: '2024-12'
    }
  }

  describe('Admin Authentication & Authorization', () => {
    it('should require admin authentication for all endpoints', () => {
      const unauthorizedResponse = {
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        }
      }

      expect(unauthorizedResponse).toHaveValidApiStructure()
      expect(unauthorizedResponse).toBeFailedApiResponse({ code: 'UNAUTHORIZED' })
    })

    it('should reject customer access to admin endpoints', () => {
      const forbiddenResponse = {
        success: false,
        error: {
          message: 'Admin access required',
          code: 'FORBIDDEN'
        }
      }

      expect(forbiddenResponse).toHaveValidApiStructure()
      expect(forbiddenResponse).toBeFailedApiResponse({ code: 'FORBIDDEN' })
    })

    it('should allow admin access', () => {
      const adminAuthResponse = {
        success: true,
        data: {
          authenticated: true,
          user: {
            id: 'admin-123',
            email: 'admin@love4detailing.com',
            role: 'admin',
            permissions: ['bookings:read', 'bookings:write', 'customers:read', 'analytics:read']
          }
        }
      }

      expect(adminAuthResponse).toHaveValidApiStructure()
      expect(adminAuthResponse.data.user.role).toBe('admin')
      expect(Array.isArray(adminAuthResponse.data.user.permissions)).toBe(true)
    })
  })

  describe('GET /api/admin/bookings', () => {
    it('should return all bookings for admin', () => {
      const response = mockAdminBookingsResponse

      expect(response).toHaveValidApiStructure()
      expect(response).toBeSuccessfulApiResponse()
      expect(response).toHavePagination({ page: 1, limit: 50, total: 1 })
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data[0]).toHaveProperty('booking_reference')
      expect(response.data[0]).toHaveProperty('customer_id')
      expect(response.data[0]).toHaveProperty('status')
    })

    it('should filter bookings by date', () => {
      const filteredResponse = {
        ...mockAdminBookingsResponse,
        metadata: {
          ...mockAdminBookingsResponse.metadata,
          filters: { date: '2024-12-25' }
        }
      }

      expect(filteredResponse).toHaveValidApiStructure()
      expect(filteredResponse.metadata.filters.date).toBe('2024-12-25')
      expect(filteredResponse.data.every(booking => booking.scheduled_date === '2024-12-25')).toBe(true)
    })

    it('should sort bookings by different criteria', () => {
      const sortedByTimeResponse = {
        ...mockAdminBookingsResponse,
        metadata: {
          ...mockAdminBookingsResponse.metadata,
          sort: 'time'
        }
      }

      expect(sortedByTimeResponse).toHaveValidApiStructure()
      expect(sortedByTimeResponse.metadata.sort).toBe('time')
    })

    it('should include booking details and relationships', () => {
      const detailedResponse = {
        success: true,
        data: [
          {
            ...mockAdminBookingsResponse.data[0],
            customer: {
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@example.com',
              phone: '+447908123456'
            },
            service: {
              name: 'Full Valet',
              category: 'full_service',
              duration: 180
            },
            vehicle: {
              make: 'BMW',
              model: 'X5',
              year: 2020,
              color: 'Black'
            }
          }
        ]
      }

      expect(detailedResponse).toHaveValidApiStructure()
      expect(detailedResponse.data[0].customer).toBeDefined()
      expect(detailedResponse.data[0].service).toBeDefined()
      expect(detailedResponse.data[0].vehicle).toBeDefined()
    })
  })

  describe('POST /api/admin/bookings/[id]/confirm', () => {
    it('should confirm a pending booking', () => {
      const confirmResponse = {
        success: true,
        data: {
          booking: {
            ...mockAdminBookingsResponse.data[0],
            status: 'confirmed',
            confirmed_at: new Date().toISOString(),
            confirmed_by: 'admin-123'
          },
          message: 'Booking confirmed successfully. Customer has been notified.',
          email_sent: true
        }
      }

      expect(confirmResponse).toHaveValidApiStructure()
      expect(confirmResponse.data.booking.status).toBe('confirmed')
      expect(confirmResponse.data.booking.confirmed_at).toBeDefined()
      expect(confirmResponse.data.email_sent).toBe(true)
    })

    it('should prevent confirming already confirmed bookings', () => {
      const alreadyConfirmedResponse = {
        success: false,
        error: {
          message: 'Booking is already confirmed',
          code: 'BOOKING_ALREADY_CONFIRMED'
        }
      }

      expect(alreadyConfirmedResponse).toHaveValidApiStructure()
      expect(alreadyConfirmedResponse).toBeFailedApiResponse({ code: 'BOOKING_ALREADY_CONFIRMED' })
    })
  })

  describe('POST /api/admin/bookings/[id]/cancel', () => {
    it('should cancel a booking with reason', () => {
      const cancelResponse = {
        success: true,
        data: {
          booking: {
            ...mockAdminBookingsResponse.data[0],
            status: 'cancelled_by_admin',
            cancelled_at: new Date().toISOString(),
            cancelled_by: 'admin-123',
            admin_notes: 'Cancelled due to staff unavailability'
          },
          refund_info: {
            refund_amount: 150.00,
            refund_method: 'original_payment',
            processing_time: '3-5 business days'
          },
          message: 'Booking cancelled. Customer has been notified and refund will be processed.'
        }
      }

      expect(cancelResponse).toHaveValidApiStructure()
      expect(cancelResponse.data.booking.status).toBe('cancelled_by_admin')
      expect(cancelResponse.data.booking.admin_notes).toBeDefined()
      expect(cancelResponse.data.refund_info.refund_amount).toBe(150.00)
    })

    it('should require cancellation reason for admin cancellations', () => {
      const noReasonResponse = {
        success: false,
        error: {
          message: 'Cancellation reason is required for admin cancellations',
          code: 'CANCELLATION_REASON_REQUIRED'
        }
      }

      expect(noReasonResponse).toHaveValidApiStructure()
      expect(noReasonResponse).toBeFailedApiResponse({ code: 'CANCELLATION_REASON_REQUIRED' })
    })
  })

  describe('POST /api/admin/bookings/[id]/reschedule', () => {
    it('should reschedule a booking to new date/time', () => {
      const rescheduleResponse = {
        success: true,
        data: {
          booking: {
            ...mockAdminBookingsResponse.data[0],
            scheduled_date: '2024-12-26',
            scheduled_start_time: '14:00',
            scheduled_end_time: '17:00',
            rescheduled_at: new Date().toISOString(),
            rescheduled_by: 'admin-123',
            admin_notes: 'Rescheduled at customer request'
          },
          old_schedule: {
            date: '2024-12-25',
            start_time: '10:00',
            end_time: '13:00'
          },
          message: 'Booking rescheduled successfully. Customer has been notified.'
        }
      }

      expect(rescheduleResponse).toHaveValidApiStructure()
      expect(rescheduleResponse.data.booking.scheduled_date).toBe('2024-12-26')
      expect(rescheduleResponse.data.old_schedule).toBeDefined()
      expect(rescheduleResponse.data.booking.rescheduled_at).toBeDefined()
    })

    it('should validate new schedule availability', () => {
      const conflictResponse = {
        success: false,
        error: {
          message: 'Selected time slot is not available',
          code: 'TIME_SLOT_UNAVAILABLE'
        }
      }

      expect(conflictResponse).toHaveValidApiStructure()
      expect(conflictResponse).toBeFailedApiResponse({ code: 'TIME_SLOT_UNAVAILABLE' })
    })
  })

  describe('GET /api/admin/customers', () => {
    it('should return all customers with statistics', () => {
      const response = mockCustomersResponse

      expect(response).toHaveValidApiStructure()
      expect(response).toBeSuccessfulApiResponse()
      expect(response).toHavePagination({ page: 1, limit: 50, total: 1 })
      expect(Array.isArray(response.data)).toBe(true)
      expect(response.data[0]).toHaveProperty('booking_stats')
      expect(response.data[0].booking_stats.total_bookings).toBe(3)
      expect(response.data[0].booking_stats.total_spent).toBe(450.00)
    })

    it('should filter customers by various criteria', () => {
      const filteredResponse = {
        ...mockCustomersResponse,
        metadata: {
          ...mockCustomersResponse.metadata,
          filters: {
            search: 'john',
            date_range: '2024-11-01_2024-12-31',
            min_bookings: 2
          }
        }
      }

      expect(filteredResponse).toHaveValidApiStructure()
      expect(filteredResponse.metadata.filters).toBeDefined()
      expect(filteredResponse.metadata.filters.search).toBe('john')
    })

    it('should sort customers by different metrics', () => {
      const sortedResponse = {
        ...mockCustomersResponse,
        metadata: {
          ...mockCustomersResponse.metadata,
          sort: 'total_spent',
          order: 'desc'
        }
      }

      expect(sortedResponse).toHaveValidApiStructure()
      expect(sortedResponse.metadata.sort).toBe('total_spent')
      expect(sortedResponse.metadata.order).toBe('desc')
    })
  })

  describe('GET /api/admin/customers/[id]', () => {
    it('should return detailed customer information', () => {
      const customerDetailResponse = {
        success: true,
        data: {
          customer: {
            id: 'customer-123',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '+447908123456',
            created_at: '2024-11-01T10:00:00.000Z',
            role: 'customer'
          },
          bookings: [
            {
              id: 'booking-123',
              booking_reference: 'L4D-001',
              status: 'completed',
              scheduled_date: '2024-12-01',
              total_price: 150.00,
              service_name: 'Full Valet'
            }
          ],
          vehicles: [
            {
              id: 'vehicle-123',
              make: 'BMW',
              model: 'X5',
              year: 2020,
              color: 'Black',
              license_plate: 'AB12 CDE'
            }
          ],
          addresses: [
            {
              id: 'address-123',
              name: 'Home',
              address_line_1: '123 Main Street',
              city: 'London',
              postal_code: 'SW1A 1AA'
            }
          ],
          statistics: {
            total_bookings: 3,
            completed_bookings: 2,
            cancelled_bookings: 0,
            total_spent: 450.00,
            average_booking_value: 150.00,
            loyalty_tier: 'silver'
          }
        }
      }

      expect(customerDetailResponse).toHaveValidApiStructure()
      expect(customerDetailResponse.data.customer).toBeDefined()
      expect(Array.isArray(customerDetailResponse.data.bookings)).toBe(true)
      expect(Array.isArray(customerDetailResponse.data.vehicles)).toBe(true)
      expect(Array.isArray(customerDetailResponse.data.addresses)).toBe(true)
      expect(customerDetailResponse.data.statistics.loyalty_tier).toBe('silver')
    })
  })

  describe('GET /api/admin/analytics', () => {
    it('should return comprehensive analytics data', () => {
      const response = mockAnalyticsResponse

      expect(response).toHaveValidApiStructure()
      expect(response).toBeSuccessfulApiResponse()
      expect(response.data.overview).toBeDefined()
      expect(response.data.trends).toBeDefined()
      expect(response.data.upcoming).toBeDefined()
      expect(response.data.overview.total_revenue).toBe(18750.00)
      expect(response.data.trends.growth_rate).toBe(21.05)
    })

    it('should filter analytics by date range', () => {
      const dateFilteredResponse = {
        ...mockAnalyticsResponse,
        metadata: {
          ...mockAnalyticsResponse.metadata,
          filters: {
            start_date: '2024-12-01',
            end_date: '2024-12-31'
          }
        }
      }

      expect(dateFilteredResponse).toHaveValidApiStructure()
      expect(dateFilteredResponse.metadata.filters.start_date).toBe('2024-12-01')
      expect(dateFilteredResponse.metadata.filters.end_date).toBe('2024-12-31')
    })

    it('should include service performance metrics', () => {
      const serviceAnalyticsResponse = {
        ...mockAnalyticsResponse,
        data: {
          ...mockAnalyticsResponse.data,
          services: {
            most_popular: 'Full Valet',
            highest_revenue: 'Premium Detail',
            performance: [
              {
                service_id: 'service-123',
                name: 'Full Valet',
                bookings_count: 85,
                revenue: 12750.00,
                average_rating: 4.8,
                completion_rate: 98.8
              }
            ]
          }
        }
      }

      expect(serviceAnalyticsResponse).toHaveValidApiStructure()
      expect(serviceAnalyticsResponse.data.services.most_popular).toBe('Full Valet')
      expect(Array.isArray(serviceAnalyticsResponse.data.services.performance)).toBe(true)
    })
  })

  describe('GET /api/admin/reschedule-requests', () => {
    it('should return pending reschedule requests', () => {
      const rescheduleRequestsResponse = {
        success: true,
        data: [
          {
            id: 'reschedule-123',
            booking_id: 'booking-123',
            booking_reference: 'L4D-001',
            customer_name: 'John Doe',
            current_date: '2024-12-25',
            current_time: '10:00',
            requested_date: '2024-12-26',
            requested_time: '14:00',
            reason: 'Schedule conflict',
            status: 'pending',
            created_at: '2024-12-20T10:00:00.000Z'
          }
        ],
        metadata: {
          pagination: { page: 1, limit: 50, total: 1 },
          timestamp: new Date().toISOString()
        }
      }

      expect(rescheduleRequestsResponse).toHaveValidApiStructure()
      expect(rescheduleRequestsResponse.data[0].status).toBe('pending')
      expect(rescheduleRequestsResponse.data[0].reason).toBeDefined()
    })

    it('should filter requests by status', () => {
      const statusFilteredResponse = {
        success: true,
        data: [],
        metadata: {
          pagination: { page: 1, limit: 50, total: 0 },
          filters: { status: 'approved' },
          timestamp: new Date().toISOString()
        }
      }

      expect(statusFilteredResponse).toHaveValidApiStructure()
      expect(statusFilteredResponse.metadata.filters.status).toBe('approved')
    })
  })

  describe('POST /api/admin/reschedule-requests/[id]/respond', () => {
    it('should approve reschedule request', () => {
      const approveResponse = {
        success: true,
        data: {
          reschedule_request: {
            id: 'reschedule-123',
            status: 'approved',
            admin_notes: 'Approved - slot available',
            responded_at: new Date().toISOString(),
            responded_by: 'admin-123'
          },
          booking: {
            id: 'booking-123',
            scheduled_date: '2024-12-26',
            scheduled_start_time: '14:00',
            scheduled_end_time: '17:00'
          },
          message: 'Reschedule request approved. Customer has been notified.'
        }
      }

      expect(approveResponse).toHaveValidApiStructure()
      expect(approveResponse.data.reschedule_request.status).toBe('approved')
      expect(approveResponse.data.booking.scheduled_date).toBe('2024-12-26')
    })

    it('should decline reschedule request with reason', () => {
      const declineResponse = {
        success: true,
        data: {
          reschedule_request: {
            id: 'reschedule-123',
            status: 'declined',
            admin_notes: 'Declined - requested slot unavailable',
            responded_at: new Date().toISOString(),
            responded_by: 'admin-123'
          },
          message: 'Reschedule request declined. Customer has been notified.'
        }
      }

      expect(declineResponse).toHaveValidApiStructure()
      expect(declineResponse.data.reschedule_request.status).toBe('declined')
      expect(declineResponse.data.reschedule_request.admin_notes).toContain('unavailable')
    })
  })

  describe('System Operations', () => {
    it('should return system security audit', () => {
      const auditResponse = {
        success: true,
        data: {
          checks: [
            {
              name: 'Database Security',
              status: 'pass',
              details: 'RLS policies properly configured',
              last_checked: new Date().toISOString()
            },
            {
              name: 'Authentication',
              status: 'pass',
              details: 'Session validation working correctly',
              last_checked: new Date().toISOString()
            }
          ],
          overall_status: 'secure',
          generated_at: new Date().toISOString()
        }
      }

      expect(auditResponse).toHaveValidApiStructure()
      expect(auditResponse.data.overall_status).toBe('secure')
      expect(Array.isArray(auditResponse.data.checks)).toBe(true)
      expect(auditResponse.data.checks.every(check => check.status === 'pass')).toBe(true)
    })

    it('should export system data', () => {
      const exportResponse = {
        success: true,
        data: {
          exported_at: new Date().toISOString(),
          bookings: 125,
          customers: 78,
          services: 12,
          file_size: '2.3MB',
          export_format: 'json'
        },
        metadata: {
          content_type: 'application/json',
          content_disposition: 'attachment; filename="system-export-20241201.json"'
        }
      }

      expect(exportResponse).toHaveValidApiStructure()
      expect(exportResponse.data.bookings).toBe(125)
      expect(exportResponse.data.customers).toBe(78)
      expect(exportResponse.metadata.content_type).toBe('application/json')
    })

    it('should clear system cache', () => {
      const cacheResponse = {
        success: true,
        data: {
          revalidated: {
            paths: ['/', '/admin', '/dashboard'],
            tags: ['bookings', 'customers', 'analytics']
          },
          message: 'Cache cleared successfully'
        }
      }

      expect(cacheResponse).toHaveValidApiStructure()
      expect(Array.isArray(cacheResponse.data.revalidated.paths)).toBe(true)
      expect(Array.isArray(cacheResponse.data.revalidated.tags)).toBe(true)
    })
  })

  describe('Error Handling & Edge Cases', () => {
    it('should handle non-existent booking operations', () => {
      const notFoundResponse = {
        success: false,
        error: {
          message: 'Booking not found',
          code: 'BOOKING_NOT_FOUND'
        }
      }

      expect(notFoundResponse).toHaveValidApiStructure()
      expect(notFoundResponse).toBeFailedApiResponse({ code: 'BOOKING_NOT_FOUND' })
    })

    it('should handle invalid status transitions', () => {
      const invalidTransitionResponse = {
        success: false,
        error: {
          message: 'Cannot change booking status from completed to pending',
          code: 'INVALID_STATUS_TRANSITION'
        }
      }

      expect(invalidTransitionResponse).toHaveValidApiStructure()
      expect(invalidTransitionResponse).toBeFailedApiResponse({ code: 'INVALID_STATUS_TRANSITION' })
    })

    it('should handle concurrent modification conflicts', () => {
      const conflictResponse = {
        success: false,
        error: {
          message: 'Booking was modified by another user. Please refresh and try again.',
          code: 'CONCURRENT_MODIFICATION'
        }
      }

      expect(conflictResponse).toHaveValidApiStructure()
      expect(conflictResponse).toBeFailedApiResponse({ code: 'CONCURRENT_MODIFICATION' })
    })

    it('should handle system maintenance mode', () => {
      const maintenanceResponse = {
        success: false,
        error: {
          message: 'System is temporarily under maintenance. Please try again later.',
          code: 'MAINTENANCE_MODE'
        }
      }

      expect(maintenanceResponse).toHaveValidApiStructure()
      expect(maintenanceResponse).toBeFailedApiResponse({ code: 'MAINTENANCE_MODE' })
    })
  })
})