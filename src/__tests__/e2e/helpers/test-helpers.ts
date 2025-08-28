/**
 * E2E Test Helpers
 * 
 * Reusable helper functions for Playwright E2E tests,
 * including authentication, navigation, and assertions.
 */

import { Page, Locator, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Authentication helpers
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Load customer authentication state
   */
  async loginAsCustomer() {
    try {
      const authStatePath = join(__dirname, '../auth-states/customer.json')
      const authState = JSON.parse(readFileSync(authStatePath, 'utf8'))
      
      // Set authentication cookies/local storage
      await this.page.evaluate((auth) => {
        localStorage.setItem('supabase.auth.token', JSON.stringify(auth.session))
        localStorage.setItem('user', JSON.stringify(auth.user))
      }, authState)
      
      await this.page.reload()
    } catch (error) {
      console.warn('Failed to load customer auth state, using manual login')
      await this.manualCustomerLogin()
    }
  }

  /**
   * Load admin authentication state
   */
  async loginAsAdmin() {
    try {
      const authStatePath = join(__dirname, '../auth-states/admin.json')
      const authState = JSON.parse(readFileSync(authStatePath, 'utf8'))
      
      await this.page.evaluate((auth) => {
        localStorage.setItem('supabase.auth.token', JSON.stringify(auth.session))
        localStorage.setItem('user', JSON.stringify(auth.user))
      }, authState)
      
      await this.page.reload()
    } catch (error) {
      console.warn('Failed to load admin auth state, using manual login')
      await this.manualAdminLogin()
    }
  }

  /**
   * Manual customer login fallback
   */
  async manualCustomerLogin() {
    await this.page.goto('/auth/login')
    await this.page.fill('[data-testid="email-input"]', 'test.customer@example.com')
    await this.page.fill('[data-testid="password-input"]', 'testpassword123')
    await this.page.click('[data-testid="login-button"]')
    await this.page.waitForURL('/dashboard')
  }

  /**
   * Manual admin login fallback
   */
  async manualAdminLogin() {
    await this.page.goto('/auth/login')
    await this.page.fill('[data-testid="email-input"]', 'test.admin@example.com')
    await this.page.fill('[data-testid="password-input"]', 'adminpassword123')
    await this.page.click('[data-testid="login-button"]')
    await this.page.waitForURL('/admin')
  }

  /**
   * Logout current user
   */
  async logout() {
    await this.page.click('[data-testid="user-menu"]')
    await this.page.click('[data-testid="logout-button"]')
    await this.page.waitForURL('/')
  }
}

/**
 * Navigation helpers
 */
export class NavigationHelper {
  constructor(private page: Page) {}

  /**
   * Navigate to booking flow
   */
  async goToBooking() {
    await this.page.goto('/book')
    await this.page.waitForSelector('[data-testid="booking-flow"]')
  }

  /**
   * Navigate to admin dashboard
   */
  async goToAdminDashboard() {
    await this.page.goto('/admin')
    await this.page.waitForSelector('[data-testid="admin-dashboard"]')
  }

  /**
   * Navigate to customer dashboard
   */
  async goToCustomerDashboard() {
    await this.page.goto('/dashboard')
    await this.page.waitForSelector('[data-testid="customer-dashboard"]')
  }

  /**
   * Wait for page to load completely
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForSelector('body:not(.loading)')
  }
}

/**
 * Booking flow helpers
 */
export class BookingHelper {
  constructor(private page: Page) {}

  /**
   * Complete service selection step
   */
  async selectService(serviceName: string = 'Exterior Detail') {
    await this.page.waitForSelector('[data-testid="service-selection"]')
    
    const serviceCard = this.page.locator(`[data-testid="service-card"]`)
      .filter({ hasText: serviceName })
    
    await serviceCard.click()
    await this.page.click('[data-testid="next-button"]')
  }

  /**
   * Complete time slot selection step
   */
  async selectTimeSlot(dateOffset: number = 1) {
    await this.page.waitForSelector('[data-testid="time-slot-selection"]')
    
    // Select date (tomorrow by default)
    const today = new Date()
    const targetDate = new Date(today)
    targetDate.setDate(targetDate.getDate() + dateOffset)
    
    const dayButton = this.page.locator(`[data-date="${targetDate.toISOString().split('T')[0]}"]`)
    await dayButton.click()
    
    // Wait for time slots to load
    await this.page.waitForSelector('[data-testid="time-slot"]')
    
    // Select first available time slot
    const availableSlot = this.page.locator('[data-testid="time-slot"]:not([disabled])').first()
    await availableSlot.click()
    await this.page.click('[data-testid="next-button"]')
  }

  /**
   * Complete vehicle details step
   */
  async fillVehicleDetails(vehicle = {
    make: 'Toyota',
    model: 'Camry',
    year: '2020',
    color: 'Blue',
    licensePlate: 'TEST123'
  }) {
    await this.page.waitForSelector('[data-testid="vehicle-details"]')
    
    await this.page.fill('[data-testid="vehicle-make"]', vehicle.make)
    await this.page.fill('[data-testid="vehicle-model"]', vehicle.model)
    await this.page.fill('[data-testid="vehicle-year"]', vehicle.year)
    await this.page.fill('[data-testid="vehicle-color"]', vehicle.color)
    await this.page.fill('[data-testid="vehicle-license-plate"]', vehicle.licensePlate)
    
    await this.page.click('[data-testid="next-button"]')
  }

  /**
   * Complete user details step
   */
  async fillUserDetails(user = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe.test@example.com',
    phone: '07123456789'
  }) {
    await this.page.waitForSelector('[data-testid="user-details"]')
    
    await this.page.fill('[data-testid="first-name"]', user.firstName)
    await this.page.fill('[data-testid="last-name"]', user.lastName)
    await this.page.fill('[data-testid="email"]', user.email)
    await this.page.fill('[data-testid="phone"]', user.phone)
    
    await this.page.click('[data-testid="next-button"]')
  }

  /**
   * Complete address details step
   */
  async fillAddress(address = {
    street: '123 Test Street',
    city: 'London',
    postcode: 'SW1A 1AA'
  }) {
    await this.page.waitForSelector('[data-testid="address-details"]')
    
    await this.page.fill('[data-testid="street-address"]', address.street)
    await this.page.fill('[data-testid="city"]', address.city)
    await this.page.fill('[data-testid="postcode"]', address.postcode)
    
    await this.page.click('[data-testid="next-button"]')
  }

  /**
   * Complete entire booking flow
   */
  async completeBooking(options = {}) {
    await this.selectService(options.service)
    await this.selectTimeSlot(options.dateOffset)
    await this.fillVehicleDetails(options.vehicle)
    await this.fillUserDetails(options.user)
    await this.fillAddress(options.address)
    
    // Confirm booking
    await this.page.waitForSelector('[data-testid="booking-confirmation"]')
    await this.page.click('[data-testid="confirm-booking"]')
    
    // Wait for success message
    await this.page.waitForSelector('[data-testid="booking-success"]')
  }
}

/**
 * Admin helpers
 */
export class AdminHelper {
  constructor(private page: Page) {}

  /**
   * View all bookings in admin panel
   */
  async viewBookings() {
    await this.page.click('[data-testid="admin-nav-bookings"]')
    await this.page.waitForSelector('[data-testid="bookings-table"]')
  }

  /**
   * Confirm a booking
   */
  async confirmBooking(bookingId: string) {
    await this.viewBookings()
    
    const bookingRow = this.page.locator(`[data-booking-id="${bookingId}"]`)
    await bookingRow.locator('[data-testid="confirm-button"]').click()
    
    await this.page.waitForSelector('[data-testid="confirm-modal"]')
    await this.page.click('[data-testid="confirm-booking-button"]')
    
    await expect(this.page.locator('.toast')).toContainText('Booking confirmed')
  }

  /**
   * Cancel a booking with reason
   */
  async cancelBooking(bookingId: string, reason: string = 'Test cancellation') {
    await this.viewBookings()
    
    const bookingRow = this.page.locator(`[data-booking-id="${bookingId}"]`)
    await bookingRow.locator('[data-testid="cancel-button"]').click()
    
    await this.page.waitForSelector('[data-testid="cancel-modal"]')
    await this.page.fill('[data-testid="cancellation-reason"]', reason)
    await this.page.click('[data-testid="cancel-booking-button"]')
    
    await expect(this.page.locator('.toast')).toContainText('Booking cancelled')
  }

  /**
   * Reschedule a booking
   */
  async rescheduleBooking(bookingId: string, newDate: string, newTime: string) {
    await this.viewBookings()
    
    const bookingRow = this.page.locator(`[data-booking-id="${bookingId}"]`)
    await bookingRow.locator('[data-testid="reschedule-button"]').click()
    
    await this.page.waitForSelector('[data-testid="reschedule-modal"]')
    await this.page.fill('[data-testid="new-date"]', newDate)
    await this.page.selectOption('[data-testid="new-time"]', newTime)
    await this.page.click('[data-testid="reschedule-booking-button"]')
    
    await expect(this.page.locator('.toast')).toContainText('Booking rescheduled')
  }
}

/**
 * Assertion helpers
 */
export class AssertionHelper {
  constructor(private page: Page) {}

  /**
   * Assert page title contains text
   */
  async assertPageTitle(expectedText: string) {
    await expect(this.page).toHaveTitle(new RegExp(expectedText, 'i'))
  }

  /**
   * Assert element is visible
   */
  async assertElementVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible()
  }

  /**
   * Assert element contains text
   */
  async assertElementText(selector: string, expectedText: string) {
    await expect(this.page.locator(selector)).toContainText(expectedText)
  }

  /**
   * Assert form validation error
   */
  async assertValidationError(fieldSelector: string, errorText: string) {
    const field = this.page.locator(fieldSelector)
    const errorElement = this.page.locator(`${fieldSelector} + .error, [aria-describedby*="${fieldSelector}"]`)
    
    await expect(field).toHaveClass(/error|invalid/)
    await expect(errorElement).toContainText(errorText)
  }

  /**
   * Assert URL matches pattern
   */
  async assertURL(expectedPattern: string | RegExp) {
    await expect(this.page).toHaveURL(expectedPattern)
  }

  /**
   * Assert toast notification
   */
  async assertToast(messageText: string) {
    const toast = this.page.locator('[data-testid="toast"], .toast, [role="alert"]')
    await expect(toast).toContainText(messageText)
  }
}

/**
 * Performance helpers
 */
export class PerformanceHelper {
  constructor(private page: Page) {}

  /**
   * Measure page load time
   */
  async measurePageLoad(): Promise<number> {
    const startTime = Date.now()
    await this.page.waitForLoadState('networkidle')
    return Date.now() - startTime
  }

  /**
   * Check Core Web Vitals
   */
  async getCoreWebVitals() {
    return await this.page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries()
          const vitals = {}
          
          for (const entry of entries) {
            if (entry.name === 'FCP') vitals.fcp = entry.value
            if (entry.name === 'LCP') vitals.lcp = entry.value
            if (entry.name === 'CLS') vitals.cls = entry.value
          }
          
          resolve(vitals)
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] })
      })
    })
  }
}

/**
 * Utility functions
 */
export function generateTestEmail(): string {
  return `test.user.${Date.now()}@example.com`
}

export function generateBookingReference(): string {
  return `TEST-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

export async function waitForAnimation(page: Page, timeout = 1000) {
  await page.waitForTimeout(timeout)
}