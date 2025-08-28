/**
 * Test Data Factories
 * 
 * Factories for creating consistent test data across different test suites.
 * Helps ensure data consistency and reduces duplication in tests.
 */

export interface TestUserData {
  id?: string
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  role?: 'customer' | 'admin' | 'super_admin'
  created_at?: string
  updated_at?: string
  is_active?: boolean
}

export interface TestBookingData {
  id?: string
  booking_reference?: string
  customer_id?: string
  service_id?: string
  vehicle_id?: string
  address_id?: string
  scheduled_date?: string
  scheduled_start_time?: string
  scheduled_end_time?: string
  status?: string
  payment_status?: string
  total_price?: number
  created_at?: string
  updated_at?: string
}

export interface TestServiceData {
  id?: string
  name?: string
  short_description?: string
  long_description?: string
  category?: string
  base_price?: number
  duration?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface TestVehicleData {
  id?: string
  customer_id?: string
  make?: string
  model?: string
  year?: number
  color?: string
  license_plate?: string
  registration?: string
  created_at?: string
}

export interface TestAddressData {
  id?: string
  customer_id?: string
  name?: string
  address_line_1?: string
  address_line_2?: string
  city?: string
  county?: string
  postal_code?: string
  country?: string
  is_default?: boolean
  created_at?: string
}

/**
 * Factory for creating test users
 */
export class UserFactory {
  private static idCounter = 1

  static create(overrides: TestUserData = {}): TestUserData {
    const id = overrides.id || `user-${this.idCounter++}`
    const timestamp = new Date().toISOString()

    return {
      id,
      email: `test-${id}@love4detailing.com`,
      first_name: 'Test',
      last_name: 'User',
      phone: '+447908123456',
      role: 'customer',
      created_at: timestamp,
      updated_at: timestamp,
      is_active: true,
      ...overrides
    }
  }

  static createCustomer(overrides: TestUserData = {}): TestUserData {
    return this.create({ role: 'customer', ...overrides })
  }

  static createAdmin(overrides: TestUserData = {}): TestUserData {
    return this.create({
      role: 'admin',
      email: `admin-${Date.now()}@love4detailing.com`,
      first_name: 'Admin',
      last_name: 'User',
      ...overrides
    })
  }

  static createBatch(count: number, overrides: TestUserData = {}): TestUserData[] {
    return Array.from({ length: count }, (_, i) => 
      this.create({ 
        first_name: `User${i + 1}`,
        email: `user-${i + 1}-${Date.now()}@love4detailing.com`,
        ...overrides 
      })
    )
  }
}

/**
 * Factory for creating test bookings
 */
export class BookingFactory {
  private static idCounter = 1

  static create(overrides: TestBookingData = {}): TestBookingData {
    const id = overrides.id || `booking-${this.idCounter++}`
    const timestamp = new Date().toISOString()
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    return {
      id,
      booking_reference: `L4D-TEST-${String(this.idCounter).padStart(3, '0')}`,
      customer_id: overrides.customer_id || 'customer-1',
      service_id: 'service-1',
      vehicle_id: 'vehicle-1',
      address_id: 'address-1',
      scheduled_date: tomorrow.toISOString().split('T')[0],
      scheduled_start_time: '10:00',
      scheduled_end_time: '13:00',
      status: 'pending',
      payment_status: 'pending',
      total_price: 150.00,
      created_at: timestamp,
      updated_at: timestamp,
      ...overrides
    }
  }

  static createConfirmed(overrides: TestBookingData = {}): TestBookingData {
    return this.create({
      status: 'confirmed',
      payment_status: 'paid',
      ...overrides
    })
  }

  static createCompleted(overrides: TestBookingData = {}): TestBookingData {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    return this.create({
      scheduled_date: yesterday.toISOString().split('T')[0],
      status: 'completed',
      payment_status: 'paid',
      ...overrides
    })
  }

  static createBatch(count: number, overrides: TestBookingData = {}): TestBookingData[] {
    return Array.from({ length: count }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() + i + 1)
      
      return this.create({
        booking_reference: `L4D-TEST-${String(i + 1).padStart(3, '0')}`,
        scheduled_date: date.toISOString().split('T')[0],
        ...overrides
      })
    })
  }
}

/**
 * Factory for creating test services
 */
export class ServiceFactory {
  private static idCounter = 1

  static create(overrides: TestServiceData = {}): TestServiceData {
    const id = overrides.id || `service-${this.idCounter++}`
    const timestamp = new Date().toISOString()

    return {
      id,
      name: 'Test Service',
      short_description: 'A test service for automated testing',
      long_description: 'Complete description of the test service with all details',
      category: 'full_service',
      base_price: 150.00,
      duration: 180,
      is_active: true,
      created_at: timestamp,
      updated_at: timestamp,
      ...overrides
    }
  }

  static createFullValet(overrides: TestServiceData = {}): TestServiceData {
    return this.create({
      name: 'Full Valet Service',
      short_description: 'Complete interior and exterior cleaning',
      category: 'full_service',
      base_price: 180.00,
      duration: 240,
      ...overrides
    })
  }

  static createQuickWash(overrides: TestServiceData = {}): TestServiceData {
    return this.create({
      name: 'Quick Wash',
      short_description: 'Fast exterior wash and dry',
      category: 'wash_only',
      base_price: 45.00,
      duration: 45,
      ...overrides
    })
  }

  static createBatch(count: number, overrides: TestServiceData = {}): TestServiceData[] {
    return Array.from({ length: count }, (_, i) => 
      this.create({
        name: `Test Service ${i + 1}`,
        base_price: 100.00 + (i * 25),
        duration: 120 + (i * 30),
        ...overrides
      })
    )
  }
}

/**
 * Factory for creating test vehicles
 */
export class VehicleFactory {
  private static idCounter = 1
  private static makes = ['BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Toyota', 'Honda']
  private static models = ['X5', 'C-Class', 'A4', 'Golf', 'Camry', 'Civic']
  private static colors = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Grey']

  static create(overrides: TestVehicleData = {}): TestVehicleData {
    const id = overrides.id || `vehicle-${this.idCounter++}`
    const timestamp = new Date().toISOString()
    const makeIndex = (this.idCounter - 1) % this.makes.length

    return {
      id,
      customer_id: overrides.customer_id || 'customer-1',
      make: this.makes[makeIndex],
      model: this.models[makeIndex],
      year: 2018 + (this.idCounter % 7),
      color: this.colors[makeIndex],
      license_plate: `AB${String(this.idCounter).padStart(2, '0')} CDE`,
      registration: `REG${this.idCounter}`,
      created_at: timestamp,
      ...overrides
    }
  }

  static createBMW(overrides: TestVehicleData = {}): TestVehicleData {
    return this.create({
      make: 'BMW',
      model: 'X5',
      year: 2020,
      color: 'Black',
      ...overrides
    })
  }

  static createBatch(count: number, customerId: string, overrides: TestVehicleData = {}): TestVehicleData[] {
    return Array.from({ length: count }, () => 
      this.create({ customer_id: customerId, ...overrides })
    )
  }
}

/**
 * Factory for creating test addresses
 */
export class AddressFactory {
  private static idCounter = 1

  static create(overrides: TestAddressData = {}): TestAddressData {
    const id = overrides.id || `address-${this.idCounter++}`
    const timestamp = new Date().toISOString()

    return {
      id,
      customer_id: overrides.customer_id || 'customer-1',
      name: 'Home',
      address_line_1: `${100 + this.idCounter} Test Street`,
      address_line_2: '',
      city: 'London',
      county: 'Greater London',
      postal_code: `SW${this.idCounter}A ${this.idCounter}AA`,
      country: 'United Kingdom',
      is_default: true,
      created_at: timestamp,
      ...overrides
    }
  }

  static createWork(overrides: TestAddressData = {}): TestAddressData {
    return this.create({
      name: 'Work',
      address_line_1: '25 Business Park',
      city: 'Canary Wharf',
      postal_code: 'E14 5AB',
      is_default: false,
      ...overrides
    })
  }

  static createBatch(count: number, customerId: string, overrides: TestAddressData = {}): TestAddressData[] {
    return Array.from({ length: count }, (_, i) => 
      this.create({
        customer_id: customerId,
        name: i === 0 ? 'Home' : `Address ${i + 1}`,
        is_default: i === 0,
        postal_code: `SW${i + 1}A ${i + 1}AA`,
        ...overrides
      })
    )
  }
}

/**
 * API Response Factory
 */
export class ApiResponseFactory {
  static success<T>(data: T, metadata?: Record<string, unknown>) {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    }
  }

  static error(message: string, code: string, details?: unknown) {
    return {
      success: false,
      error: {
        message,
        code,
        details
      },
      metadata: {
        timestamp: new Date().toISOString()
      }
    }
  }

  static validationError(message: string, validationErrors: Record<string, string[]>) {
    return this.error(message, 'INVALID_INPUT', { validationErrors })
  }

  static paginated<T>(data: T[], page = 1, limit = 20, total?: number) {
    return this.success(data, {
      pagination: {
        page,
        limit,
        total: total ?? data.length,
        totalPages: Math.ceil((total ?? data.length) / limit)
      }
    })
  }
}

/**
 * Complete test scenario factory
 */
export class ScenarioFactory {
  /**
   * Create a complete booking scenario with user, service, vehicle, and address
   */
  static completeBooking(overrides: {
    user?: TestUserData
    booking?: TestBookingData
    service?: TestServiceData
    vehicle?: TestVehicleData
    address?: TestAddressData
  } = {}) {
    const user = UserFactory.create(overrides.user)
    const service = ServiceFactory.create(overrides.service)
    const vehicle = VehicleFactory.create({ customer_id: user.id, ...overrides.vehicle })
    const address = AddressFactory.create({ customer_id: user.id, ...overrides.address })
    const booking = BookingFactory.create({
      customer_id: user.id,
      service_id: service.id,
      vehicle_id: vehicle.id,
      address_id: address.id,
      ...overrides.booking
    })

    return { user, booking, service, vehicle, address }
  }

  /**
   * Create admin management scenario with multiple bookings and customers
   */
  static adminDashboard(customerCount = 5, bookingsPerCustomer = 3) {
    const admin = UserFactory.createAdmin()
    const customers = UserFactory.createBatch(customerCount)
    const services = ServiceFactory.createBatch(3)
    
    const bookings = customers.flatMap(customer => 
      BookingFactory.createBatch(bookingsPerCustomer, {
        customer_id: customer.id,
        service_id: services[Math.floor(Math.random() * services.length)].id
      })
    )

    return { admin, customers, services, bookings }
  }
}

// Export all factories
export const Factories = {
  User: UserFactory,
  Booking: BookingFactory,
  Service: ServiceFactory,
  Vehicle: VehicleFactory,
  Address: AddressFactory,
  ApiResponse: ApiResponseFactory,
  Scenario: ScenarioFactory
}