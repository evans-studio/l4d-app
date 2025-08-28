/**
 * Test Database Helpers
 * 
 * Utilities for setting up and managing test database state
 * for Love4Detailing API testing.
 */

import { supabaseAdmin } from '@/lib/supabase/direct'
import { logger } from '@/lib/utils/logger'

export interface TestUser {
  id: string
  email: string
  password?: string
  role: 'customer' | 'admin' | 'super_admin'
  first_name: string
  last_name: string
  phone?: string
}

export interface TestBooking {
  id: string
  booking_reference: string
  customer_id: string
  status: string
  scheduled_date: string
  scheduled_start_time: string
  scheduled_end_time: string
  total_price: number
  payment_status: string
}

export interface TestService {
  id: string
  name: string
  category: string
  base_price: number
  duration: number
  is_active: boolean
}

export class TestDatabase {
  private static instance: TestDatabase
  private createdUsers: string[] = []
  private createdBookings: string[] = []
  private createdServices: string[] = []

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase()
    }
    return TestDatabase.instance
  }

  /**
   * Create a test user with profile
   */
  async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const defaultUser: TestUser = {
      id: '',
      email: `test-${Date.now()}@love4detailing.test`,
      password: 'TestPassword123!',
      role: 'customer',
      first_name: 'Test',
      last_name: 'User',
      phone: '+447908123456',
      ...userData
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: defaultUser.email,
        password: defaultUser.password,
        email_confirm: true,
        user_metadata: {
          first_name: defaultUser.first_name,
          last_name: defaultUser.last_name,
          phone: defaultUser.phone,
          role: defaultUser.role
        }
      })

      if (authError || !authData.user) {
        throw new Error(`Failed to create test user: ${authError?.message}`)
      }

      defaultUser.id = authData.user.id
      this.createdUsers.push(defaultUser.id)

      // Create user profile
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: defaultUser.id,
          email: defaultUser.email,
          first_name: defaultUser.first_name,
          last_name: defaultUser.last_name,
          phone: defaultUser.phone || null,
          role: defaultUser.role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        logger.error('Failed to create user profile:', profileError)
        throw new Error(`Failed to create user profile: ${profileError.message}`)
      }

      return defaultUser

    } catch (error) {
      logger.error('Error creating test user:', error)
      throw error
    }
  }

  /**
   * Create a test admin user
   */
  async createTestAdmin(): Promise<TestUser> {
    return this.createTestUser({
      email: `admin-${Date.now()}@love4detailing.test`,
      role: 'admin',
      first_name: 'Admin',
      last_name: 'User'
    })
  }

  /**
   * Create a test service
   */
  async createTestService(serviceData: Partial<TestService> = {}): Promise<TestService> {
    const defaultService: TestService = {
      id: '',
      name: 'Test Full Valet',
      category: 'full_service',
      base_price: 150.00,
      duration: 180,
      is_active: true,
      ...serviceData
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('services')
        .insert({
          name: defaultService.name,
          short_description: 'Test service for automated testing',
          long_description: 'Complete test service description',
          category: defaultService.category,
          base_price: defaultService.base_price,
          duration: defaultService.duration,
          is_active: defaultService.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !data) {
        throw new Error(`Failed to create test service: ${error?.message}`)
      }

      defaultService.id = data.id
      this.createdServices.push(defaultService.id)

      return defaultService

    } catch (error) {
      logger.error('Error creating test service:', error)
      throw error
    }
  }

  /**
   * Create a test booking
   */
  async createTestBooking(bookingData: Partial<TestBooking> = {}, customerId?: string): Promise<TestBooking> {
    // Create customer if not provided
    let customer: TestUser
    if (!customerId) {
      customer = await this.createTestUser()
      customerId = customer.id
    }

    // Create service if needed
    const service = await this.createTestService()

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const defaultBooking: TestBooking = {
      id: '',
      booking_reference: `L4D-TEST-${Date.now()}`,
      customer_id: customerId,
      status: 'pending',
      scheduled_date: tomorrowStr,
      scheduled_start_time: '10:00',
      scheduled_end_time: '13:00',
      total_price: 150.00,
      payment_status: 'pending',
      ...bookingData
    }

    try {
      const { data, error } = await supabaseAdmin
        .from('bookings')
        .insert({
          booking_reference: defaultBooking.booking_reference,
          customer_id: defaultBooking.customer_id,
          status: defaultBooking.status,
          scheduled_date: defaultBooking.scheduled_date,
          scheduled_start_time: defaultBooking.scheduled_start_time,
          scheduled_end_time: defaultBooking.scheduled_end_time,
          total_price: defaultBooking.total_price,
          payment_status: defaultBooking.payment_status,
          pricing_breakdown: { base_price: defaultBooking.total_price },
          vehicle_details: { make: 'Test', model: 'Vehicle', year: 2020 },
          service_address: { 
            address_line_1: '123 Test Street', 
            city: 'Test City', 
            postal_code: 'TE1 1ST' 
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error || !data) {
        throw new Error(`Failed to create test booking: ${error?.message}`)
      }

      defaultBooking.id = data.id
      this.createdBookings.push(defaultBooking.id)

      // Create booking service relationship
      await supabaseAdmin
        .from('booking_services')
        .insert({
          booking_id: defaultBooking.id,
          service_id: service.id,
          price: defaultBooking.total_price,
          estimated_duration: service.duration,
          service_details: {
            name: service.name,
            category: service.category
          },
          created_at: new Date().toISOString()
        })

      return defaultBooking

    } catch (error) {
      logger.error('Error creating test booking:', error)
      throw error
    }
  }

  /**
   * Clean up all test data
   */
  async cleanup(): Promise<void> {
    try {
      // Clean up bookings and their relationships
      if (this.createdBookings.length > 0) {
        await supabaseAdmin
          .from('booking_services')
          .delete()
          .in('booking_id', this.createdBookings)

        await supabaseAdmin
          .from('bookings')
          .delete()
          .in('id', this.createdBookings)
      }

      // Clean up services
      if (this.createdServices.length > 0) {
        await supabaseAdmin
          .from('services')
          .delete()
          .in('id', this.createdServices)
      }

      // Clean up users (profiles first, then auth)
      if (this.createdUsers.length > 0) {
        await supabaseAdmin
          .from('user_profiles')
          .delete()
          .in('id', this.createdUsers)

        // Clean up auth users
        for (const userId of this.createdUsers) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(userId)
          } catch (error) {
            // Continue cleanup even if individual user deletion fails
            logger.warn(`Failed to delete auth user ${userId}:`, error)
          }
        }
      }

      // Reset tracking arrays
      this.createdUsers = []
      this.createdBookings = []
      this.createdServices = []

    } catch (error) {
      logger.error('Error during test cleanup:', error)
      // Don't throw - cleanup should be best effort
    }
  }

  /**
   * Get a test user session token for API calls
   */
  async getSessionToken(userId: string): Promise<string> {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.generateAccessToken(userId)
      
      if (error || !data) {
        throw new Error(`Failed to generate session token: ${error?.message}`)
      }

      return data.access_token

    } catch (error) {
      logger.error('Error generating session token:', error)
      throw error
    }
  }

  /**
   * Reset database to clean state (for integration tests)
   */
  async reset(): Promise<void> {
    await this.cleanup()
  }
}

export const testDb = TestDatabase.getInstance()